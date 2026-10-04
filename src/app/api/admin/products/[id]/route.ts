import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { revalidateTag } from "next/cache";

const UpdateProductSchema = z.object({
  version: z.number().int(),
  sku: z.string().trim().min(1).max(50).optional(),
  name: z.string().trim().min(2).max(200).optional(),
  categoryId: z.string().uuid().optional(),
  shortDesc: z.string().trim().optional().nullable(),
  longDesc: z.string().trim().optional().nullable(),
  brand: z.string().trim().optional(),
  packSize: z.string().trim().min(1).optional(),
  unit: z.string().trim().min(1).optional(),
  mrpPaise: z.number().int().min(0).optional(),
  pricePaise: z.number().int().min(0).optional(),
  availability: z.enum(["IN_STOCK", "LIMITED", "OUT_OF_STOCK", "UNAVAILABLE"]).optional(),
  stockQuantity: z.number().int().optional().nullable(),
  lowStockAlert: z.number().int().optional().nullable(),
  isFeatured: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  imageUrl: z.string().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await withAdminAuth("PRODUCTS_VIEW", async () => {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!product) {
      throw new Error("Product not found.");
    }

    return product;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 404 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid product data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { version: clientVersion, imageUrl, ...updateData } = parsed.data;

  const result = await withAdminAuth("PRODUCTS_EDIT_BASIC", async (session) => {
    // 1. Fetch current product to check existence & version
    const current = await prisma.product.findUnique({
      where: { id },
    });

    if (!current) {
      throw new Error("Product not found.");
    }

    // 2. Optimistic locking check
    if (current.version !== clientVersion) {
      const err: any = new Error("This product was modified by another administrator. Please reload to review the latest changes.");
      err.code = "VERSION_CONFLICT";
      throw err;
    }

    // 3. Update with atomic version increment
    const updated = await prisma.product.update({
      where: { id, version: clientVersion },
      data: {
        ...updateData,
        version: { increment: 1 },
      },
    });

    // Handle primary image update if provided
    if (imageUrl) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      await prisma.productImage.create({
        data: {
          productId: id,
          url: imageUrl,
          isPrimary: true,
          sortOrder: 0,
        },
      });
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "PRODUCT_UPDATE",
        entity: "Product",
        entityId: id,
        beforeData: { pricePaise: current.pricePaise, availability: current.availability, version: current.version },
        afterData: { pricePaise: updated.pricePaise, availability: updated.availability, version: updated.version },
      },
    });

    try {
      revalidateTag("products");
    } catch {}

    return updated;
  });

  if (!result.ok && result.code === "VERSION_CONFLICT") {
    return NextResponse.json(result, { status: 409 });
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await withAdminAuth("PRODUCTS_CRUD", async (session) => {
    const product = await prisma.product.update({
      where: { id },
      data: { isArchived: true, version: { increment: 1 } },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "PRODUCT_ARCHIVE",
        entity: "Product",
        entityId: id,
      },
    });

    try {
      revalidateTag("products");
    } catch {}

    return { message: "Product archived successfully", id: product.id };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
