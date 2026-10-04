import React from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { CombosClient } from "@/components/admin/CombosClient";

export const metadata: Metadata = {
  title: "Combos & Gift Boxes — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminCombosPage() {
  const [combos, products] = await Promise.all([
    prisma.combo.findMany({
      where: { isArchived: false },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                pricePaise: true,
                availability: true,
                isArchived: true,
              },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { isArchived: false },
      select: {
        id: true,
        name: true,
        sku: true,
        pricePaise: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <CombosClient initialCombos={combos} availableProducts={products} />
    </div>
  );
}
