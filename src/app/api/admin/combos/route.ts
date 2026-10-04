import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { revalidateTag } from "next/cache";

const ComboItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

const CreateComboSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  comboPaise: z.number().int().min(0),
  image: z.string().trim().optional().nullable(),
  availability: z.enum(["IN_STOCK", "LIMITED", "OUT_OF_STOCK", "UNAVAILABLE"]).default("IN_STOCK"),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  items: z.array(ComboItemSchema).min(1, "A combo must contain at least one product"),
});

export async function GET() {
  const result = await withAdminAuth("COMBOS_MANAGE", async () => {
    const combos = await prisma.combo.findMany({
      where: { isArchived: false },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, pricePaise: true, availability: true, isArchived: true },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return combos;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateComboSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid combo data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const result = await withAdminAuth("COMBOS_MANAGE", async (session) => {
    // 1. Verify included products exist and are active
    const productIds = data.items.map((i) => i.productId);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, isArchived: false },
    });

    if (existingProducts.length !== productIds.length) {
      throw new Error("One or more selected products are invalid, missing, or archived.");
    }

    // 2. Compute original aggregate value
    let originalPaise = 0;
    data.items.forEach((item) => {
      const prod = existingProducts.find((p) => p.id === item.productId)!;
      originalPaise += prod.pricePaise * item.quantity;
    });

    const baseSlug = (data.slug || data.name).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    let slug = baseSlug;
    let count = 1;
    while (await prisma.combo.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    const combo = await prisma.combo.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        image: data.image || null,
        originalPaise,
        comboPaise: data.comboPaise,
        availability: data.availability,
        isFeatured: data.isFeatured,
        sortOrder: data.sortOrder,
        items: {
          create: data.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "COMBO_CREATE",
        entity: "Combo",
        entityId: combo.id,
        afterData: { name: combo.name, comboPaise: combo.comboPaise },
      },
    });

    revalidateTag("combos");
    return combo;
  });

  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
