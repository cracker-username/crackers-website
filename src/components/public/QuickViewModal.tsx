"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, ShoppingBag, ShieldCheck, ArrowRight } from "lucide-react";
import { formatPaise, calculateDiscountPercent } from "@/lib/utils/money";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { SparkBurst } from "./SparkBurst";

export interface QuickViewProduct {
  id: string;
  name: string;
  sku: string;
  slug: string;
  packSize: string;
  unit: string;
  pricePaise: number;
  mrpPaise: number;
  availability: "IN_STOCK" | "LIMITED" | "OUT_OF_STOCK" | "UNAVAILABLE";
  shortDesc?: string | null;
  specifications?: Array<{ label: string; value: string }> | null;
  category: {
    name: string;
    slug: string;
    colorFrom: string;
    colorTo: string;
  };
  images: Array<{ url: string; altText?: string | null }>;
}

export function QuickViewModal({
  product,
  isOpen,
  onClose,
}: {
  product: QuickViewProduct | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [activeSpark, setActiveSpark] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const triggerSpark = useCartStore((state) => state.triggerSpark);

  if (!isOpen || !product) return null;

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-bg-1 border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <SparkBurst active={activeSpark} />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent-magenta"
          aria-label="Close Quick View"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Column */}
        <div className="w-full md:w-1/2 relative bg-bg-0 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-white/10">
          <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={primaryImg}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Details Column */}
        <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
          {/* Category & SKU */}
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="gradient"
              colorFrom={product.category.colorFrom}
              colorTo={product.category.colorTo}
            >
              {product.category.name}
            </Badge>
            <span className="text-xs font-mono font-bold text-accent-magenta">{product.sku}</span>
          </div>

          <h3 id="quick-view-title" className="font-heading font-extrabold text-xl text-foreground mb-1">
            {product.name}
          </h3>

          <p className="text-xs text-text-muted mb-4">
            Pack: <strong>{product.packSize}</strong> ({product.unit})
          </p>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 mb-4">
            <span className="font-heading font-extrabold text-2xl text-accent-gold">
              {formatPaise(product.pricePaise)}
            </span>
            {product.mrpPaise > product.pricePaise && (
              <>
                <span className="text-xs text-text-muted/60 line-through">
                  {formatPaise(product.mrpPaise)}
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {discountPercent}% OFF
                </span>
              </>
            )}
          </div>

          {/* Description */}
          {product.shortDesc && (
            <p className="text-xs text-text-muted leading-relaxed mb-4">
              {product.shortDesc}
            </p>
          )}

          {/* Quantity Stepper & Add to Enquiry */}
          <div className="mt-auto pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-text-muted">Quantity:</span>
              <div className="inline-flex items-center rounded-xl bg-white/10 border border-white/10">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-2 hover:text-accent-gold transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-foreground">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="p-2 hover:text-accent-gold transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <Button
              onClick={handleAdd}
              disabled={!isAvailable}
              variant={isAvailable ? "primary" : "outline"}
              size="lg"
              className="w-full font-bold flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isAvailable ? "Add to Enquiry" : "Out of Stock"}</span>
            </Button>

            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1.5 text-text-muted/70 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Direct Sivakasi Formulation</span>
              </div>
              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="text-accent-gold font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>Full Details</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
