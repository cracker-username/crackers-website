import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { revalidateTag } from "next/cache";

const CategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  colorFrom: z.string().trim().default("#FF2E93"),
  colorTo: z.string().trim().default("#FF7A18"),
  image: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  const result = await withAdminAuth("CATEGORIES_MANAGE", async () => {
    const categories = await prisma.category.findMany({
      where: { isArchived: false },
      include: {
        _count: {
          select: { products: { where: { isArchived: false } } },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return categories;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CategorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid category data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const result = await withAdminAuth("CATEGORIES_MANAGE", async (session) => {
    const baseSlug = (data.slug || data.name).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    let slug = baseSlug;
    let count = 1;
    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        colorFrom: data.colorFrom,
        colorTo: data.colorTo,
        image: data.image || null,
        sortOrder: data.sortOrder,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CATEGORY_CREATE",
        entity: "Category",
        entityId: category.id,
        afterData: { name: category.name, slug: category.slug },
      },
    });

    revalidateTag("categories");

    return category;
  });

  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
