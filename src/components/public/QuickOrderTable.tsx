"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, ShoppingBag, Check, ChevronDown, ArrowRight } from "lucide-react";
import { formatPaise, calculateDiscountPercent } from "@/lib/utils/money";
import { useCartStore } from "@/store/useCartStore";
import { ProductCardData } from "./ProductCard";
import { Badge } from "../ui/Badge";
import { SparkBurst } from "./SparkBurst";

interface QuickOrderTableProps {
  products: ProductCardData[];
  showMrpAndDiscount?: boolean;
}

export function QuickOrderTable({
  products,
  showMrpAndDiscount = true,
}: QuickOrderTableProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [sparkId, setSparkId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [mobileVisibleCount, setMobileVisibleCount] = useState(20);

  const addItem = useCartStore((state) => state.addItem);
  const triggerSpark = useCartStore((state) => state.triggerSpark);

  const getQty = (id: string) => quantities[id] || 1;
  const setQty = (id: string, val: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, Math.min(9999, val)) }));
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = (product: ProductCardData) => {
    const isAvailable =
      product.availability === "IN_STOCK" || product.availability === "LIMITED";
    if (!isAvailable) return;

    const qty = getQty(product.id);
    const primaryImg = product.images[0]?.url || `/placeholders/${product.category.slug}.svg`;

    addItem(
      {
        id: product.id,
        name: product.name,
        sku: product.sku,
        packSize: product.packSize,
        unit: product.unit,
        pricePaise: product.pricePaise,
        mrpPaise: product.mrpPaise,
        image: primaryImg,
        categorySlug: product.category.slug,
        colorFrom: product.category.colorFrom,
        colorTo: product.category.colorTo,
        isCombo: false,
      },
      qty
    );

    triggerSpark(product.id);
    setSparkId(product.id);
    setAddedId(product.id);
    setTimeout(() => setSparkId(null), 600);
    setTimeout(() => setAddedId(null), 1400);
  };

  const mobileProducts = products.slice(0, mobileVisibleCount);

  return (
    <div className="w-full">
      {/* 1. DEDICATED MOBILE PRESENTATION (< 1024px) — NO HORIZONTAL TABLE SCROLL */}
      <div className="block lg:hidden space-y-3.5 w-full">
        {mobileProducts.map((p) => {
          const isAvailable =
            p.availability === "IN_STOCK" || p.availability === "LIMITED";
          const discount = calculateDiscountPercent(p.mrpPaise, p.pricePaise);
          const qty = getQty(p.id);
          const isExpanded = expandedIds.has(p.id);
          const isAdded = addedId === p.id;
          const primaryImg =
            p.images[0]?.url || `/placeholders/${p.category.slug}.svg`;

          return (
            <div
              key={p.id}
              className="relative w-full rounded-2xl bg-bg-1 border border-white/10 hover:border-white/20 p-3.5 transition-all shadow-md overflow-hidden"
            >
              {sparkId === p.id && <SparkBurst active={true} />}

              {/* Category accent top bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background: `linear-gradient(90deg, ${p.category.colorFrom}, ${p.category.colorTo})`,
                }}
              />

              {/* Product Info Row */}
              <div className="flex items-start gap-3 mt-0.5">
                {/* 1. Thumbnail Image */}
                <Link
                  href={`/products/${p.slug}`}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-bg-0/80 border border-white/10 overflow-hidden relative shrink-0 block"
                  tabIndex={-1}
                >
                  <Image
                    src={primaryImg}
                    alt={p.name}
                    fill
                    className="object-contain p-1"
                    sizes="80px"
                  />
                </Link>

                {/* 2. Primary Details */}
                <div className="min-w-0 flex-1">
                  {/* Badges: SKU & Status */}
                  <div className="flex items-center justify-between gap-1.5 mb-1 flex-wrap">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-magenta/15 text-accent-magenta border border-accent-magenta/20">
                      {p.sku}
                    </span>
                    <div>
                      {p.availability === "IN_STOCK" && (
                        <Badge variant="success" className="text-[9px] py-0 px-1.5 font-bold">In Stock</Badge>
                      )}
                      {p.availability === "LIMITED" && (
                        <Badge variant="warning" className="text-[9px] py-0 px-1.5 font-bold">Limited</Badge>
                      )}
                      {p.availability === "OUT_OF_STOCK" && (
                        <Badge variant="danger" className="text-[9px] py-0 px-1.5 font-bold">Out of Stock</Badge>
                      )}
                      {p.availability === "UNAVAILABLE" && (
                        <Badge variant="default" className="text-[9px] py-0 px-1.5 font-bold">Unavailable</Badge>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <Link
                    href={`/products/${p.slug}`}
                    className="font-heading font-bold text-sm sm:text-base text-foreground hover:text-accent-gold transition-colors leading-snug line-clamp-2 block"
                  >
                    {p.name}
                  </Link>

                  {/* Pack Size / Unit */}
                  <div className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1.5">
                    <span>{p.packSize}</span>
                    <span>•</span>
                    <span className="text-text-muted/80">{p.unit}</span>
                  </div>

                  {/* Price Line */}
                  <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                    <span className="font-heading font-extrabold text-base sm:text-lg text-accent-gold">
                      {formatPaise(p.pricePaise)}
                    </span>
                    {showMrpAndDiscount && p.mrpPaise > p.pricePaise && (
                      <>
                        <span className="text-xs text-text-muted/60 line-through">
                          {formatPaise(p.mrpPaise)}
                        </span>
                        {discount > 0 && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                            {discount}% OFF
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Stepper + Add CTA Row */}
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                {/* Stepper: [ − ] 1 [ + ] with >= 44px touch targets */}
                <div className="inline-flex items-center rounded-xl bg-white/10 border border-white/10 shrink-0">
                  <button
                    onClick={() => setQty(p.id, qty - 1)}
                    disabled={!isAvailable}
                    type="button"
                    className="min-h-[44px] min-w-[42px] sm:min-w-[44px] flex items-center justify-center hover:text-accent-gold disabled:opacity-30 transition-colors"
                    aria-label={`Decrease ${p.name} quantity`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 sm:w-10 text-center font-bold text-sm text-foreground">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(p.id, qty + 1)}
                    disabled={!isAvailable}
                    type="button"
                    className="min-h-[44px] min-w-[42px] sm:min-w-[44px] flex items-center justify-center hover:text-accent-gold disabled:opacity-30 transition-colors"
                    aria-label={`Increase ${p.name} quantity`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary CTA: [ ADD TO ENQUIRY ] */}
                <button
                  onClick={() => handleAdd(p)}
                  disabled={!isAvailable}
                  type="button"
                  className={`min-h-[44px] px-3 sm:px-4 rounded-xl flex-1 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 ${
                    isAdded
                      ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                      : "bg-gradient-to-r from-accent-magenta to-accent-orange hover:brightness-110 text-white"
                  }`}
                  aria-label={`Add ${qty} of ${p.name} to enquiry`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Added to Enquiry</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-white" />
                      <span>Add to Enquiry</span>
                    </>
                  )}
                </button>
              </div>

              {/* Secondary Details Accordion */}
              <div className="mt-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => toggleExpand(p.id)}
                  type="button"
                  className="w-full flex items-center justify-between text-[11px] text-text-muted hover:text-accent-gold transition-colors py-0.5"
                  aria-expanded={isExpanded}
                >
                  <span className="font-medium">
                    {isExpanded ? "Hide Details" : "View Details"}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isExpanded ? "rotate-180 text-accent-gold" : ""
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-white/10 space-y-2 text-xs animate-fadeIn">
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-bg-0/60 p-2.5 rounded-xl border border-white/5">
                      <div>
                        <span className="text-text-muted block text-[10px] uppercase font-semibold">SKU</span>
                        <span className="font-mono text-foreground font-bold">{p.sku}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[10px] uppercase font-semibold">Category</span>
                        <span className="text-foreground">{p.category.name}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[10px] uppercase font-semibold">Pack Size</span>
                        <span className="text-foreground">{p.packSize}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[10px] uppercase font-semibold">Unit Type</span>
                        <span className="text-foreground">{p.unit}</span>
                      </div>
                      {showMrpAndDiscount && (
                        <>
                          <div>
                            <span className="text-text-muted block text-[10px] uppercase font-semibold">MRP</span>
                            <span className="text-foreground/80 line-through">{formatPaise(p.mrpPaise)}</span>
                          </div>
                          <div>
                            <span className="text-text-muted block text-[10px] uppercase font-semibold">Discount</span>
                            <span className="text-emerald-400 font-bold">{discount}% OFF</span>
                          </div>
                        </>
                      )}
                      <div className="col-span-2">
                        <span className="text-text-muted block text-[10px] uppercase font-semibold">Availability</span>
                        <span className="text-foreground font-semibold">
                          {p.availability === "IN_STOCK" ? "In Stock (Ready for festival quotation)" : p.availability}
                        </span>
                      </div>
                    </div>
                    {p.shortDesc && (
                      <p className="text-[11px] text-text-muted leading-relaxed">
                        {p.shortDesc}
                      </p>
                    )}
                    <Link
                      href={`/products/${p.slug}`}
                      className="inline-flex items-center gap-1 text-[11px] text-accent-gold hover:underline font-semibold"
                    >
                      <span>View full specifications & instructions</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Large Catalogue Performance: Load More */}
        {products.length > mobileVisibleCount && (
          <div className="pt-4 pb-2 flex flex-col items-center gap-2">
            <span className="text-xs text-text-muted">
              Showing <strong>{Math.min(mobileVisibleCount, products.length)}</strong> of <strong>{products.length}</strong>
            </span>
            <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-magenta to-accent-gold transition-all duration-300"
                style={{
                  width: `${(Math.min(mobileVisibleCount, products.length) / products.length) * 100}%`,
                }}
              />
            </div>
            <button
              onClick={() => setMobileVisibleCount((prev) => prev + 20)}
              type="button"
              className="mt-2 min-h-[44px] px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-foreground text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <span>Load More ({products.length - mobileVisibleCount} remaining)</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. DESKTOP PRESERVATION (>= 1024px) — COMPLETE MULTI-COLUMN TABLE */}
      <div className="hidden lg:block w-full overflow-hidden rounded-2xl bg-bg-1 border border-white/10 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-bg-0/60 text-text-muted font-heading font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4 min-w-[200px]">Product</th>
                <th className="py-3.5 px-3 min-w-[90px]">SKU</th>
                <th className="py-3.5 px-3 min-w-[120px]">Category</th>
                <th className="py-3.5 px-3 min-w-[100px]">Pack Size</th>
                {showMrpAndDiscount && (
                  <th className="py-3.5 px-3 min-w-[90px]">MRP</th>
                )}
                <th className="py-3.5 px-3 min-w-[100px]">Enquiry Price</th>
                <th className="py-3.5 px-3 min-w-[110px]">Status</th>
                <th className="py-3.5 px-4 min-w-[180px] text-right">Order Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map((p) => {
                const isAvailable =
                  p.availability === "IN_STOCK" || p.availability === "LIMITED";
                const discount = calculateDiscountPercent(p.mrpPaise, p.pricePaise);
                const qty = getQty(p.id);

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-white/[0.02] transition-colors group relative"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-bg-0 border border-white/10 overflow-hidden relative shrink-0">
                          <Image
                            src={p.images[0]?.url || `/placeholders/${p.category.slug}.svg`}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/products/${p.slug}`}
                            className="font-semibold text-foreground hover:text-accent-gold transition-colors truncate block max-w-xs"
                          >
                            {p.name}
                          </Link>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-3 font-mono text-xs font-bold text-accent-magenta">
                      {p.sku}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: p.category.colorFrom }}
                      >
                        {p.category.name}
                      </span>
                    </td>

                    {/* Pack Size */}
                    <td className="py-3 px-3 text-text-muted">
                      {p.packSize}
                    </td>

                    {/* MRP (if enabled) */}
                    {showMrpAndDiscount && (
                      <td className="py-3 px-3 text-text-muted/60 line-through">
                        {p.mrpPaise > p.pricePaise ? formatPaise(p.mrpPaise) : "-"}
                      </td>
                    )}

                    {/* Enquiry Price */}
                    <td className="py-3 px-3 font-heading font-extrabold text-accent-gold text-sm md:text-base">
                      {formatPaise(p.pricePaise)}
                      {showMrpAndDiscount && discount > 0 && (
                        <span className="block text-[10px] text-accent-lime font-bold">
                          {discount}% OFF
                        </span>
                      )}
                    </td>

                    {/* Availability */}
                    <td className="py-3 px-3">
                      {p.availability === "IN_STOCK" && (
                        <Badge variant="success" className="text-[10px]">In Stock</Badge>
                      )}
                      {p.availability === "LIMITED" && (
                        <Badge variant="warning" className="text-[10px]">Limited</Badge>
                      )}
                      {p.availability === "OUT_OF_STOCK" && (
                        <Badge variant="danger" className="text-[10px]">Out of Stock</Badge>
                      )}
                      {p.availability === "UNAVAILABLE" && (
                        <Badge variant="default" className="text-[10px]">Unavailable</Badge>
                      )}
                    </td>

                    {/* Order Stepper + Add Button */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2 relative">
                        {sparkId === p.id && <SparkBurst active={true} />}
                        <div className="inline-flex items-center rounded-lg bg-white/10 border border-white/10">
                          <button
                            onClick={() => setQty(p.id, qty - 1)}
                            disabled={!isAvailable}
                            type="button"
                            className="min-h-[40px] min-w-[36px] flex items-center justify-center hover:text-accent-gold disabled:opacity-30 transition-colors"
                            aria-label={`Decrease ${p.name} quantity`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-bold text-xs">
                            {qty}
                          </span>
                          <button
                            onClick={() => setQty(p.id, qty + 1)}
                            disabled={!isAvailable}
                            type="button"
                            className="min-h-[40px] min-w-[36px] flex items-center justify-center hover:text-accent-gold disabled:opacity-30 transition-colors"
                            aria-label={`Increase ${p.name} quantity`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleAdd(p)}
                          disabled={!isAvailable}
                          type="button"
                          className={`min-h-[40px] min-w-[40px] p-2 rounded-lg flex items-center justify-center font-bold text-xs disabled:opacity-40 transition-all shadow-md active:scale-95 ${
                            addedId === p.id
                              ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                              : "bg-gradient-to-r from-accent-magenta to-accent-orange hover:brightness-110 text-white"
                          }`}
                          aria-label={`Add ${qty} of ${p.name} to enquiry`}
                          title={addedId === p.id ? "Added to enquiry!" : "Add to enquiry"}
                        >
                          {addedId === p.id ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : (
                            <ShoppingBag className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
