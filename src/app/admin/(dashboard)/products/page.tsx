import React from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { ProductTable } from "@/components/admin/ProductTable";

export const metadata: Metadata = {
  title: "Products Management — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const categories = await prisma.category.findMany({
    where: { isArchived: false },
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ProductTable initialCategories={categories} />
    </div>
  );
}
