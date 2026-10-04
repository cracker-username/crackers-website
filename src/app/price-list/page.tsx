import React, { Suspense } from "react";
import { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { parseSettingValue } from "@/lib/settings/registry";
import { ProductCard } from "@/components/public/ProductCard";
import { QuickOrderTable } from "@/components/public/QuickOrderTable";
import { PriceListFilterBar } from "@/components/public/PriceListFilterBar";
import { StickyEnquiryBar } from "@/components/public/StickyEnquiryBar";
import { Sparkles, FileSpreadsheet } from "lucide-react";

export const metadata: Metadata = {
  title: "Sivakasi Crackers Price List 2026 — Genuine Factory Estimates",
  description:
    "Complete Sivakasi firecrackers price list 2026. Browse sparklers, pots, rockets, ground chakkars and multi-shot aerial repeaters with instant enquiry quotation.",
};

interface PriceListPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    min?: string;
    max?: string;
    flag?: string;
    availability?: string;
    view?: string;
  }>;
}

export default async function PriceListPage({ searchParams }: PriceListPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const categorySlug = params.category || "";
  const sort = params.sort || "featured";
  const flag = params.flag || "";
  const availability = params.availability || "";
  const viewMode = (params.view === "table" ? "table" : "cards") as "cards" | "table";

  // Check showMrpAndDiscount from settings
  let showMrpAndDiscount = true;
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "showMrpAndDiscount" } });
    if (setting) {
      showMrpAndDiscount = parseSettingValue("showMrpAndDiscount", setting.value);
    }
  } catch (err) {
    console.warn("Could not load showMrpAndDiscount setting:", err);
  }

  // Fetch categories
  const categories = await prisma.category.findMany({
    where: { isActive: true, isArchived: false },
    orderBy: { sortOrder: "asc" },
  });

  // Build where filter
  const where: any = {
    isActive: true,
    isArchived: false,
  };

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (flag === "bestseller") where.isBestseller = true;
  if (flag === "featured") where.isFeatured = true;
  if (flag === "new") where.isNewArrival = true;
  if (flag === "premium") where.isPremium = true;

  if (availability === "in_stock") where.availability = "IN_STOCK";
  if (availability === "limited") where.availability = "LIMITED";

  // Determine sorting
  let orderBy: any = [{ sortOrder: "asc" }, { name: "asc" }];
  if (sort === "popular") orderBy = [{ isBestseller: "desc" }, { sortOrder: "asc" }];
  if (sort === "newest") orderBy = [{ isNewArrival: "desc" }, { createdAt: "desc" }];
  if (sort === "price_asc") orderBy = [{ pricePaise: "asc" }];
  if (sort === "price_desc") orderBy = [{ pricePaise: "desc" }];

  // Query products
  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
    orderBy,
  });

  const totalCount = await prisma.product.count({
    where: { isActive: true, isArchived: false },
  });

  const formattedProducts = products.map((p) => ({
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
      name: p.category.name,
      slug: p.category.slug,
      colorFrom: p.category.colorFrom,
      colorTo: p.category.colorTo,
    },
    images: p.images.map((img) => ({ url: img.url, altText: img.altText })),
  }));

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://crackers.local").replace(/\/$/, "");

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Price List",
        "item": `${siteUrl}/price-list`,
      },
    ],
  };

  return (
    <div className="w-full min-h-screen py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Page Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-gold/15 border border-accent-gold/30 text-accent-gold text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SIVAKASI DIRECT ESTIMATE CATALOGUE</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-foreground mb-3">
          Sivakasi Crackers Price List 2026
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-2xl leading-relaxed">
          Select products and specify quantities to build your festive quotation. Minimum order ₹3,000
          for Tamil Nadu & Puducherry; ₹5,000 for all other states. No online payment required.
        </p>
      </div>

      {/* Filter and View Bar */}
      <div className="mb-8">
        <Suspense fallback={<div className="h-20 bg-white/5 rounded-2xl animate-pulse" />}>
          <PriceListFilterBar
            categories={categories.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              colorFrom: c.colorFrom,
              colorTo: c.colorTo,
            }))}
            viewMode={viewMode}
            onViewChange={(mode) => {
              // Handled by URL param sync via component
              const url = new URL(window.location.href);
              url.searchParams.set("view", mode);
              window.history.replaceState({}, "", url.toString());
              window.location.reload();
            }}
            totalCount={totalCount}
          />
        </Suspense>
      </div>

      {/* Active Results Summary */}
      <div className="flex items-center justify-between text-xs text-text-muted mb-6">
        <span>
          Showing <strong>{formattedProducts.length}</strong> {formattedProducts.length === 1 ? "cracker" : "crackers"}
          {categorySlug && ` in ${categorySlug.replace(/-/g, " ")}`}
        </span>
        <div className="flex items-center gap-1.5 text-accent-gold">
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Quick order table view available</span>
        </div>
      </div>

      {/* Main Listing View (Cards vs Table) */}
      {formattedProducts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-bg-1 border border-white/10 my-8">
          <h3 className="font-heading font-bold text-xl text-foreground mb-2">
            No crackers match your search
          </h3>
          <p className="text-xs text-text-muted max-w-md mx-auto mb-6">
            Try adjusting your search keywords, clearing applied filters, or selecting a different category.
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {formattedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showMrpAndDiscount={showMrpAndDiscount}
            />
          ))}
        </div>
      ) : (
        <QuickOrderTable
          products={formattedProducts}
          showMrpAndDiscount={showMrpAndDiscount}
        />
      )}

      {/* Persistent Bottom Sticky Summary Bar */}
      <StickyEnquiryBar />
    </div>
  );
}
