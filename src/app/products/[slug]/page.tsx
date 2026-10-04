import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { parseSettingValue } from "@/lib/settings/registry";
import { ProductDetailClient } from "@/components/public/ProductDetailClient";
import { ProductCard } from "@/components/public/ProductCard";
import { StickyEnquiryBar } from "@/components/public/StickyEnquiryBar";
import { ChevronRight, ShieldCheck, HelpCircle } from "lucide-react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.name} (${product.sku}) — Sivakasi Price List`,
    description: product.shortDesc || `Enquire about ${product.name} from Sivakasi Sparklers. Authentic Sivakasi manufacturing.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, isActive: true, isArchived: false },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) {
    notFound();
  }

  // Related products from same category
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
      isArchived: false,
    },
    include: {
      category: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 4,
  });

  // Settings for direct phone/whatsapp enquiry
  let phone = "+91 98765 43210";
  let whatsappNumber = "919876543210";
  let brandName = "Sivakasi Sparklers";

  try {
    const settings = await prisma.setting.findMany();
    const map = new Map(settings.map((s) => [s.key, s.value]));
    if (map.has("phone")) phone = parseSettingValue("phone", map.get("phone"));
    if (map.has("whatsappNumber")) whatsappNumber = parseSettingValue("whatsappNumber", map.get("whatsappNumber"));
    if (map.has("businessName")) brandName = parseSettingValue("businessName", map.get("businessName"));
  } catch (e) {
    console.warn("Failed to load settings in ProductPage:", e);
  }

  const specs = Array.isArray(product.specifications)
    ? (product.specifications as Array<{ label: string; value: string }>)
    : [
        { label: "Origin", value: "Sivakasi, Tamil Nadu" },
        { label: "Pack Size", value: product.packSize },
        { label: "Unit", value: product.unit },
        { label: "Manufacturer Brand", value: product.brand || "[BRAND_NAME]" },
      ];

  return (
    <div className="w-full min-h-screen py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-32">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/price-list" className="hover:text-foreground">Price List</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/collections/${product.category.slug}`} className="hover:text-foreground">
          {product.category.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Interactive Product Detail Client Component */}
      <ProductDetailClient
        product={{
          id: product.id,
          name: product.name,
          sku: product.sku,
          packSize: product.packSize,
          unit: product.unit,
          pricePaise: product.pricePaise,
          mrpPaise: product.mrpPaise,
          availability: product.availability,
          shortDesc: product.shortDesc,
          longDesc: product.longDesc,
          specifications: specs,
          category: {
            name: product.category.name,
            slug: product.category.slug,
            colorFrom: product.category.colorFrom,
            colorTo: product.category.colorTo,
          },
          images: product.images.map((img) => ({ url: img.url, altText: img.altText })),
        }}
        phone={phone}
        whatsappNumber={whatsappNumber}
        brandName={brandName}
      />

      {/* Detailed Specifications & Description Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Specifications Table */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-bg-1 border border-white/10">
          <h2 className="font-heading font-bold text-xl text-foreground mb-4">
            Product Specifications
          </h2>
          <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden">
            {specs.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 text-xs sm:text-sm bg-white/[0.01]">
                <span className="font-semibold text-text-muted">{s.label}</span>
                <span className="font-bold text-foreground text-right">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Long Description */}
          {product.longDesc && (
            <div className="mt-6 pt-6 border-t border-white/5 text-xs sm:text-sm text-text-muted leading-relaxed">
              <h3 className="font-heading font-bold text-base text-foreground mb-2">Description</h3>
              <p>{product.longDesc}</p>
            </div>
          )}
        </div>

        {/* Ordering & Logistics Guarantee */}
        <div className="p-6 rounded-3xl bg-bg-1 border border-white/10 flex flex-col gap-4">
          <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent-gold" />
            <span>Sivakasi Guarantee</span>
          </h3>
          <ul className="text-xs text-text-muted space-y-3 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-accent-gold font-bold">•</span>
              <span>100% direct Sivakasi formulation manufactured under strict quality standards.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-gold font-bold">•</span>
              <span>Manual verification via WhatsApp/Call to confirm transport viability to your city.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-gold font-bold">•</span>
              <span>Dispatched through licensed surface transport cargo carriers with Lorry Receipt (LR) tracking.</span>
            </li>
          </ul>

          <div className="mt-auto pt-4 border-t border-white/5">
            <Link
              href="/faq"
              className="inline-flex items-center gap-1.5 text-xs text-accent-gold font-semibold hover:underline"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Read Ordering FAQs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-white/10 pt-12">
          <h2 className="font-heading font-extrabold text-2xl text-foreground mb-6">
            Similar in {product.category.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={{
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
                  category: {
                    name: p.category.name,
                    slug: p.category.slug,
                    colorFrom: p.category.colorFrom,
                    colorTo: p.category.colorTo,
                  },
                  images: p.images.map((img) => ({ url: img.url, altText: img.altText })),
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sticky Bottom Enquiry Bar */}
      <StickyEnquiryBar />
    </div>
  );
}
