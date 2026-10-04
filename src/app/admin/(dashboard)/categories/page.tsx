import React from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { CategoriesClient } from "@/components/admin/CategoriesClient";

export const metadata: Metadata = {
  title: "Categories Management — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isArchived: false },
    include: {
      _count: {
        select: { products: { where: { isArchived: false } } },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
