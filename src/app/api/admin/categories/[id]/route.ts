import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { revalidateTag } from "next/cache";

const UpdateCategorySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().optional().nullable(),
  colorFrom: z.string().trim().optional(),
  colorTo: z.string().trim().optional(),
  image: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateCategorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid category update", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await withAdminAuth("CATEGORIES_MANAGE", async (session) => {
    const updated = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CATEGORY_UPDATE",
        entity: "Category",
        entityId: id,
        afterData: parsed.data,
      },
    });

    revalidateTag("categories");
    return updated;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await withAdminAuth("CATEGORIES_MANAGE", async (session) => {
    // Check if category still contains active products
    const activeProductsCount = await prisma.product.count({
      where: { categoryId: id, isArchived: false },
    });

    if (activeProductsCount > 0) {
      const err: any = new Error(
        `Cannot archive category: ${activeProductsCount} active product(s) are still assigned to this category. Please reassign or archive them first.`
      );
      err.code = "CATEGORY_HAS_PRODUCTS";
      throw err;
    }

    const archived = await prisma.category.update({
      where: { id },
      data: { isArchived: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CATEGORY_ARCHIVE",
        entity: "Category",
        entityId: id,
      },
    });

    revalidateTag("categories");
    return { message: "Category archived successfully", id: archived.id };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
