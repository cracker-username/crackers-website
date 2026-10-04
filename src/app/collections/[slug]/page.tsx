import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { ProductCard } from "@/components/public/ProductCard";
import { StickyEnquiryBar } from "@/components/public/StickyEnquiryBar";
import { ChevronRight, ArrowLeft } from "lucide-react";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Collection Not Found" };

  return {
    title: `${category.name} Price List 2026 — Sivakasi Sparklers`,
    description: category.description || `Browse authentic Sivakasi ${category.name} with direct factory estimates.`,
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug, isActive: true },
    include: {
      products: {
        where: { isActive: true, isArchived: false },
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!category) {
    notFound();
  }

  const formattedProducts = category.products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    slug: p.slug,
    packSize: p.packSize,
    unit: p.unit,
    mrpPaise: p.mrpPaise,
    pricePaise: p.pricePaise,
    availability: p.availability,
    isBestseller: p.isBestseller,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    isPremium: p.isPremium,
    shortDesc: p.shortDesc,
    specifications: p.specifications,
    category: {
      name: category.name,
      slug: category.slug,
      colorFrom: category.colorFrom,
      colorTo: category.colorTo,
    },
    images: p.images.map((img) => ({ url: img.url, altText: img.altText })),
  }));

  return (
    <div className="w-full min-h-screen py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-32">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/price-list" className="hover:text-foreground">Price List</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-semibold">{category.name}</span>
      </nav>

      {/* Category Header Banner with Category Gradient */}
      <div
        className="rounded-3xl p-6 sm:p-10 mb-10 relative overflow-hidden text-white shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${category.colorFrom}, ${category.colorTo})`,
        }}
      >
        <div className="relative z-10 max-w-2xl">
          <Link
            href="/price-list"
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full mb-4 text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </Link>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl md:text-5xl mb-3">
            {category.name}
          </h1>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-xl">
            {category.description || "Authentic Sivakasi festive fireworks with verified formulation."}
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {formattedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Sticky Bottom Bar */}
      <StickyEnquiryBar />
    </div>
  );
}
