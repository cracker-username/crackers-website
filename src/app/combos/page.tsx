import React from "react";
import { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { ComboCard } from "@/components/public/ComboCard";
import { Gift } from "lucide-react";
import { DEFAULT_SITE_CONFIG } from "@/lib/settings/siteConfig";

export const metadata: Metadata = {
  title: `Festival Firecracker Combo Packs 2026 — ${DEFAULT_SITE_CONFIG.name}`,
  description:
    "Curated Diwali cracker gift boxes and family celebration combos directly from Sivakasi. Save up to 50% compared to buying individual items.",
};

export default async function CombosPage() {
  const combos = await prisma.combo.findMany({
    where: { isActive: true, isArchived: false },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const formattedCombos = combos.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image,
    originalPaise: c.originalPaise,
    comboPaise: c.comboPaise,
    availability: c.availability,
    items: c.items.map((ci) => ({
      productId: ci.productId,
      productName: ci.product.name,
      productSku: ci.product.sku,
      quantity: ci.quantity,
    })),
  }));

  return (
    <div className="w-full min-h-screen py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-32">
      {/* Page Header */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-magenta/15 border border-accent-magenta/30 text-accent-magenta text-xs font-bold uppercase tracking-wider mb-3">
          <Gift className="w-3.5 h-3.5" />
          <span>CURATED FESTIVAL ASSORTMENTS</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-foreground mb-4">
          Festival Firecracker Combo Packs 2026
        </h1>
        <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
          Carefully selected family celebration assortments containing a balanced mix of sparklers, flower pots,
          ground spinners, rockets, and aerial multi-shots. Adding a combo adds one single line to your enquiry.
        </p>
      </div>

      {/* Combos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {formattedCombos.map((combo) => (
          <ComboCard key={combo.id} combo={combo} />
        ))}
      </div>
    </div>
  );
}
