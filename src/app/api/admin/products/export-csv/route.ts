import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import Papa from "papaparse";

export async function GET() {
  const result = await withAdminAuth("PRODUCTS_VIEW", async () => {
    const products = await prisma.product.findMany({
      where: { isArchived: false },
      include: { category: { select: { name: true } } },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });

    const exportRows = products.map((p) => ({
      sku: p.sku,
      name: p.name,
      categoryName: p.category.name,
      packSize: p.packSize,
      unit: p.unit,
      mrpRupees: (p.mrpPaise / 100).toFixed(2),
      priceRupees: (p.pricePaise / 100).toFixed(2),
      availability: p.availability,
      isFeatured: p.isFeatured ? "true" : "false",
      isBestseller: p.isBestseller ? "true" : "false",
      shortDesc: p.shortDesc || "",
    }));

    return Papa.unparse(exportRows);
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 401 });
  }

  return new NextResponse(result.data, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="crackers_catalogue_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
