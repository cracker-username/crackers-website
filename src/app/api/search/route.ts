import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  if (!q) {
    return NextResponse.json({ ok: true, data: [] });
  }

  try {
    // Search products by name, SKU, or category name using ILIKE
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isArchived: false,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { category: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: {
        category: true,
        images: { where: { isPrimary: true }, take: 1 },
      },
      take: 12,
      orderBy: { isBestseller: "desc" },
    });

    const data = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category.name,
      packSize: p.packSize,
      unit: p.unit,
      pricePaise: p.pricePaise,
      mrpPaise: p.mrpPaise,
      slug: p.slug,
      image: p.images[0]?.url || `/placeholders/${p.category.slug}.svg`,
      colorFrom: p.category.colorFrom,
      colorTo: p.category.colorTo,
    }));

    return NextResponse.json({ ok: true, data });
  } catch (err: unknown) {
    console.error("[Search API] Error:", err);
    return NextResponse.json(
      { ok: false, code: "SEARCH_ERROR", message: "Failed to search catalogue" },
      { status: 500 }
    );
  }
}
