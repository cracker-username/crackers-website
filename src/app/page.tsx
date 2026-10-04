import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, CheckCircle2, PhoneCall } from "lucide-react";
import { Hero } from "@/components/public/Hero";
import { TrustStrip } from "@/components/public/TrustStrip";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/db/prisma";
import { parseSettingValue } from "@/lib/settings/registry";
import { formatPaise } from "@/lib/utils/money";

export default async function HomePage() {
  // Query settings safely
  let licenseNumber = "";
  let countdownTarget = "2026-11-08T00:00:00+05:30";
  let countdownEnabled = true;
  let countdownTitle = "Diwali 2026 Booking Season Closes In:";
  let shippingWording = "";

  try {
    const settings = await prisma.setting.findMany();
    const map = new Map(settings.map((s) => [s.key, s.value]));

    if (map.has("licenseNumber")) {
      licenseNumber = parseSettingValue("licenseNumber", map.get("licenseNumber"));
    }
    if (map.has("countdownTarget")) {
      countdownTarget = parseSettingValue("countdownTarget", map.get("countdownTarget"));
    }
    if (map.has("countdownEnabled")) {
      countdownEnabled = parseSettingValue("countdownEnabled", map.get("countdownEnabled"));
    }
    if (map.has("countdownTitle")) {
      countdownTitle = parseSettingValue("countdownTitle", map.get("countdownTitle"));
    }
    if (map.has("shippingWording")) {
      shippingWording = parseSettingValue("shippingWording", map.get("shippingWording"));
    }
  } catch (err) {
    console.warn("Failed to load settings in HomePage:", err);
  }

  // Query categories
  const categories = await prisma.category.findMany({
    where: { isActive: true, isArchived: false },
    orderBy: { sortOrder: "asc" },
  });

  // Query best seller products
  const bestSellers = await prisma.product.findMany({
    where: { isActive: true, isArchived: false, isBestseller: true },
    include: {
      category: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 6,
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="w-full flex flex-col">
      {/* 1. Fireworks Hero Section */}
      <Hero
        countdownTarget={countdownTarget}
        countdownEnabled={countdownEnabled}
        countdownTitle={countdownTitle}
      />

      {/* 2. Trust Strip */}
      <TrustStrip
        licenseNumber={licenseNumber}
        shippingWording={shippingWording}
      />

      {/* 3. Featured Categories Grid */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-magenta/15 border border-accent-magenta/30 text-accent-magenta text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Varieties</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-foreground">
              Sivakasi Fireworks Categories
            </h2>
          </div>
          <Link
            href="/price-list"
            className="inline-flex items-center gap-2 text-sm font-bold text-accent-gold hover:underline group shrink-0"
          >
            <span>View Complete Price List</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/collections/${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden bg-bg-1 border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 shadow-lg flex flex-col"
            >
              {/* Category Gradient Top Accent */}
              <div
                className="h-2 w-full transition-all group-hover:h-3"
                style={{
                  background: `linear-gradient(90deg, ${cat.colorFrom}, ${cat.colorTo})`,
                }}
              />
              <div className="p-4 sm:p-5 flex flex-col flex-1">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 relative rounded-xl overflow-hidden bg-bg-0/60 border border-white/5">
                  <Image
                    src={`/placeholders/${cat.slug}.svg`}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-foreground text-center mb-1 group-hover:text-accent-gold transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-text-muted text-center line-clamp-2 leading-relaxed mb-3">
                  {cat.description || "Authentic Sivakasi festive selection."}
                </p>
                <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-center text-[11px] font-bold text-accent-gold group-hover:underline">
                  <span>Browse Products &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Best Sellers Preview */}
      {bestSellers.length > 0 && (
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-white/5">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold text-accent-gold uppercase tracking-wider block mb-1">
                Fast Moving Items
              </span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-foreground">
                Festival Best Sellers
              </h2>
            </div>
            <Link
              href="/price-list?sort=bestseller"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-accent-gold hover:underline"
            >
              <span>See All Bestsellers</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bestSellers.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-bg-1 border border-white/10 hover:border-white/20 transition-all flex items-center gap-4"
              >
                <div className="w-20 h-20 rounded-xl bg-bg-0 border border-white/10 relative overflow-hidden shrink-0">
                  <Image
                    src={item.images[0]?.url || `/placeholders/${item.category.slug}.svg`}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-accent-magenta">{item.sku}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-text-muted">
                      {item.category.name}
                    </span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-foreground truncate mb-1">
                    {item.name}
                  </h4>
                  <p className="text-xs text-text-muted mb-2">{item.packSize}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading font-extrabold text-accent-gold text-base">
                      {formatPaise(item.pricePaise)}
                    </span>
                    {item.mrpPaise > item.pricePaise && (
                      <span className="text-xs line-through text-text-muted/60">
                        {formatPaise(item.mrpPaise)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. How It Works (Browse -> Add -> Send Enquiry -> WhatsApp Confirmation) */}
      <section className="py-12 md:py-16 bg-bg-1/40 border-t border-white/5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-orange/15 border border-accent-orange/30 text-accent-orange text-xs font-bold uppercase tracking-wider mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Enquiry-First Model</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-foreground mb-4">
            How Festival Ordering Works
          </h2>
          <p className="text-sm md:text-base text-text-muted max-w-xl mx-auto mb-12">
            Online sale of firecrackers is restricted across India. We provide an honest factory price list
            and enquiry booking platform with manual confirmation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="w-8 h-8 rounded-full bg-accent-magenta text-white font-heading font-bold flex items-center justify-center text-sm mb-3">
                1
              </span>
              <h4 className="font-heading font-bold text-base text-foreground mb-1">
                Browse & Select
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Explore our full Sivakasi price list with clear specifications, pack sizes, and prices.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="w-8 h-8 rounded-full bg-accent-orange text-white font-heading font-bold flex items-center justify-center text-sm mb-3">
                2
              </span>
              <h4 className="font-heading font-bold text-base text-foreground mb-1">
                Add to Enquiry
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Adjust quantities to reach the regional minimum enquiry requirement (₹3,000 for TN/PY, ₹5,000 for others).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="w-8 h-8 rounded-full bg-accent-gold text-bg-0 font-heading font-bold flex items-center justify-center text-sm mb-3">
                3
              </span>
              <h4 className="font-heading font-bold text-base text-foreground mb-1">
                Send Enquiry
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Provide your destination city and contact number. Instant unique Enquiry ID generated.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="w-8 h-8 rounded-full bg-emerald-500 text-white font-heading font-bold flex items-center justify-center text-sm mb-3">
                4
              </span>
              <h4 className="font-heading font-bold text-base text-foreground mb-1">
                Confirm & Dispatch
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Our team confirms product availability and transport logistics directly with you via WhatsApp or Call.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Call to Action Strip */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-accent-magenta/20 via-accent-orange/20 to-accent-violet/20 border border-white/10 shadow-2xl flex flex-col items-center">
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-foreground mb-3">
            Ready to Celebrate This Festival Season?
          </h2>
          <p className="text-xs sm:text-sm text-text-muted max-w-lg mb-6 leading-relaxed">
            Download or view our genuine Sivakasi price list now and submit your festive enquiry.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/price-list">
              <Button variant="primary" size="lg" className="font-bold flex items-center gap-2">
                <span>Open Price List</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-accent-gold" />
                <span>Contact Sivakasi Team</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
