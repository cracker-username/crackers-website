"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, Eye, ShoppingBag } from "lucide-react";
import { formatPaise, calculateDiscountPercent } from "@/lib/utils/money";
import { useCartStore } from "@/store/useCartStore";
import { Badge } from "../ui/Badge";
import { SparkBurst } from "./SparkBurst";
import { QuickViewModal } from "./QuickViewModal";

export interface ProductCardData {
  id: string;
  name: string;
  sku: string;
  slug: string;
  packSize: string;
  unit: string;
  mrpPaise: number;
  pricePaise: number;
  availability: "IN_STOCK" | "LIMITED" | "OUT_OF_STOCK" | "UNAVAILABLE";
  isBestseller?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isPremium?: boolean;
  shortDesc?: string | null;
  specifications?: any;
  category: {
    name: string;
    slug: string;
    colorFrom: string;
    colorTo: string;
  };
  images: Array<{ url: string; altText?: string | null }>;
}

export function ProductCard({
  product,
  showMrpAndDiscount = true,
}: {
  product: ProductCardData;
  showMrpAndDiscount?: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [activeSpark, setActiveSpark] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const triggerSpark = useCartStore((state) => state.triggerSpark);

  const discountPercent = calculateDiscountPercent(product.mrpPaise, product.pricePaise);
  const isAvailable = product.availability === "IN_STOCK" || product.availability === "LIMITED";
  const primaryImg = product.images[0]?.url || `/placeholders/${product.category.slug}.svg`;

  const handleAdd = () => {
    if (!isAvailable) return;
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
    setActiveSpark(true);
    setTimeout(() => setActiveSpark(false), 600);
  };

  return (
    <>
      <div
        className="group relative rounded-2xl bg-bg-1 border border-white/10 hover:border-white/25 transition-all duration-300 flex flex-col overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1"
        style={{
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.4)",
        }}
      >
        <SparkBurst active={activeSpark} />

        {/* Category Gradient Top Accent Border */}
        <div
          className="h-1.5 w-full transition-all duration-300 group-hover:h-2"
          style={{
            background: `linear-gradient(90deg, ${product.category.colorFrom}, ${product.category.colorTo})`,
          }}
        />

        {/* Thumbnail Container */}
        <div className="relative w-full aspect-square bg-bg-0/80 overflow-hidden flex items-center justify-center p-4">
          <Link
            href={`/products/${product.slug}`}
            className="relative w-full h-full block focus:outline-none"
            tabIndex={-1}
          >
            <Image
              src={primaryImg}
              alt={product.name}
              fill
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </Link>

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
            {product.isBestseller && (
              <Badge variant="warning" className="text-[10px] uppercase font-bold tracking-wider">
                Bestseller
              </Badge>
            )}
            {product.isNewArrival && (
              <Badge variant="success" className="text-[10px] uppercase font-bold tracking-wider">
                New
              </Badge>
            )}
            {product.isPremium && (
              <Badge variant="gradient" colorFrom="#8B5CF6" colorTo="#EC4899" className="text-[10px] uppercase font-bold tracking-wider">
                Premium
              </Badge>
            )}
            {!isAvailable && (
              <Badge variant="danger" className="text-[10px] uppercase font-bold tracking-wider">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Quick View Button */}
          <button
            onClick={() => setIsQuickViewOpen(true)}
            type="button"
            className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-md"
            aria-label={`Quick view ${product.name}`}
            title="Quick view"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          {/* Category & SKU */}
          <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
            <span
              className="font-bold uppercase tracking-wider text-[11px]"
              style={{ color: product.category.colorFrom }}
            >
              {product.category.name}
            </span>
            <span className="font-mono text-[11px] font-semibold text-text-muted/80">
              {product.sku}
            </span>
          </div>

          {/* Product Name */}
          <Link
            href={`/products/${product.slug}`}
            className="font-heading font-bold text-base sm:text-lg text-foreground group-hover:text-accent-gold transition-colors line-clamp-1 mb-1 focus:outline-none focus:underline"
          >
            {product.name}
          </Link>

          {/* Pack size */}
          <p className="text-xs text-text-muted mb-3">
            Pack: <span className="font-semibold text-foreground/80">{product.packSize}</span>
          </p>

          {/* Pricing Row */}
          <div className="mt-auto mb-4">
            <div className="flex items-baseline gap-2">
              <span className="font-heading font-extrabold text-lg sm:text-xl text-accent-gold">
                {formatPaise(product.pricePaise)}
              </span>
              {showMrpAndDiscount && product.mrpPaise > product.pricePaise && (
                <>
                  <span className="text-xs text-text-muted/60 line-through">
                    {formatPaise(product.mrpPaise)}
                  </span>
                  <span className="text-xs font-bold text-accent-lime">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Row: Quantity Stepper & Add to Enquiry */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            {/* Quantity Stepper */}
            <div className="inline-flex items-center rounded-xl bg-white/5 border border-white/10 shrink-0">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={!isAvailable}
                type="button"
                className="p-1.5 text-text-muted hover:text-foreground disabled:opacity-40 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-foreground">
                {qty}
              </span>
              <button
                onClick={() => setQty(qty + 1)}
                disabled={!isAvailable}
                type="button"
                className="p-1.5 text-text-muted hover:text-foreground disabled:opacity-40 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add to Enquiry Button */}
            <button
              onClick={handleAdd}
              disabled={!isAvailable}
              type="button"
              className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-gradient-to-r from-accent-magenta to-accent-orange hover:brightness-110 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-accent-magenta/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
              aria-label={`Add ${product.name} to enquiry`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add to Enquiry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={isQuickViewOpen ? product : null}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  );
}
