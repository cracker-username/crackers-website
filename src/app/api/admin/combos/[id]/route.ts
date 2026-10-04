import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { revalidateTag } from "next/cache";

const ComboItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

const UpdateComboSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().optional().nullable(),
  comboPaise: z.number().int().min(0).optional(),
  image: z.string().trim().optional().nullable(),
  availability: z.enum(["IN_STOCK", "LIMITED", "OUT_OF_STOCK", "UNAVAILABLE"]).optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  items: z.array(ComboItemSchema).min(1).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateComboSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid combo update", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const result = await withAdminAuth("COMBOS_MANAGE", async (session) => {
    let originalPaise: number | undefined;

    if (data.items) {
      const productIds = data.items.map((i) => i.productId);
      const existingProducts = await prisma.product.findMany({
        where: { id: { in: productIds }, isArchived: false },
      });

      if (existingProducts.length !== productIds.length) {
        throw new Error("One or more selected products are invalid, missing, or archived.");
      }

      originalPaise = 0;
      data.items.forEach((item) => {
        const prod = existingProducts.find((p) => p.id === item.productId)!;
        originalPaise! += prod.pricePaise * item.quantity;
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.comboItem.deleteMany({ where: { comboId: id } });
        await tx.comboItem.createMany({
          data: data.items.map((i) => ({
            comboId: id,
            productId: i.productId,
            quantity: i.quantity,
          })),
        });
      }

      const { items: _, ...fields } = data;

      return await tx.combo.update({
        where: { id },
        data: {
          ...fields,
          ...(originalPaise !== undefined ? { originalPaise } : {}),
          version: { increment: 1 },
        },
      });
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "COMBO_UPDATE",
        entity: "Combo",
        entityId: id,
        afterData: { name: updated.name, comboPaise: updated.comboPaise },
      },
    });

    revalidateTag("combos");
    return updated;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await withAdminAuth("COMBOS_MANAGE", async (session) => {
    const archived = await prisma.combo.update({
      where: { id },
      data: { isArchived: true, version: { increment: 1 } },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "COMBO_ARCHIVE",
        entity: "Combo",
        entityId: id,
      },
    });

    revalidateTag("combos");
    return { message: "Combo archived successfully", id: archived.id };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
