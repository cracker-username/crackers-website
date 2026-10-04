import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { revalidateTag } from "next/cache";

const CreateProductSchema = z.object({
  sku: z.string().trim().min(1).max(50),
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().optional(),
  categoryId: z.string().uuid(),
  shortDesc: z.string().trim().optional(),
  longDesc: z.string().trim().optional(),
  brand: z.string().trim().default("Sivakasi Sparklers"),
  packSize: z.string().trim().min(1),
  unit: z.string().trim().min(1),
  mrpPaise: z.number().int().min(0),
  pricePaise: z.number().int().min(0),
  availability: z.enum(["IN_STOCK", "LIMITED", "OUT_OF_STOCK", "UNAVAILABLE"]).default("IN_STOCK"),
  stockQuantity: z.number().int().optional().nullable(),
  lowStockAlert: z.number().int().optional().default(10),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isPremium: z.boolean().default(false),
  specifications: z.any().optional(),
  sortOrder: z.number().int().default(0),
  imageUrl: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const result = await withAdminAuth("PRODUCTS_VIEW", async () => {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search")?.trim();
    const categoryId = searchParams.get("categoryId");
    const availability = searchParams.get("availability");
    const isArchived = searchParams.get("isArchived") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const skip = (page - 1) * limit;

    const where: any = { isArchived };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (availability) {
      where.availability = availability;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, products, categories] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { take: 1, orderBy: { sortOrder: "asc" } },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.category.findMany({
        where: { isArchived: false },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      products,
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid product data.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const result = await withAdminAuth("PRODUCTS_CRUD", async (session) => {
    // Generate clean unique slug
    const baseSlug = (data.slug || data.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    let slug = baseSlug;
    let count = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) {
      throw new Error(`A product with SKU "${data.sku}" already exists.`);
    }

    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        slug,
        categoryId: data.categoryId,
        shortDesc: data.shortDesc || null,
        longDesc: data.longDesc || null,
        brand: data.brand || "Sivakasi Sparklers",
        packSize: data.packSize,
        unit: data.unit,
        mrpPaise: data.mrpPaise,
        pricePaise: data.pricePaise,
        availability: data.availability,
        stockQuantity: data.stockQuantity || null,
        lowStockAlert: data.lowStockAlert || 10,
        isFeatured: data.isFeatured,
        isBestseller: data.isBestseller,
        isNewArrival: data.isNewArrival,
        isPremium: data.isPremium,
        specifications: data.specifications || null,
        sortOrder: data.sortOrder,
        version: 1,
        images: data.imageUrl
          ? {
              create: {
                url: data.imageUrl,
                isPrimary: true,
                sortOrder: 0,
              },
            }
          : undefined,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "PRODUCT_CREATE",
        entity: "Product",
        entityId: product.id,
        afterData: { sku: product.sku, name: product.name, pricePaise: product.pricePaise },
      },
    });

    try {
      revalidateTag("products");
    } catch {}

    return product;
  });

  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
