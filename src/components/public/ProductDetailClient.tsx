"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Plus,
  Minus,
  ShoppingBag,
  MessageCircle,
  Phone,
  AlertTriangle,
} from "lucide-react";
import { formatPaise, calculateDiscountPercent } from "@/lib/utils/money";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { SparkBurst } from "./SparkBurst";

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    sku: string;
    packSize: string;
    unit: string;
    pricePaise: number;
    mrpPaise: number;
    availability: "IN_STOCK" | "LIMITED" | "OUT_OF_STOCK" | "UNAVAILABLE";
    shortDesc?: string | null;
    longDesc?: string | null;
    specifications?: Array<{ label: string; value: string }> | null;
    category: {
      name: string;
      slug: string;
      colorFrom: string;
      colorTo: string;
    };
    images: Array<{ url: string; altText?: string | null }>;
  };
  phone?: string;
  whatsappNumber?: string;
  brandName?: string;
}

export function ProductDetailClient({
  product,
  phone = "+91 98765 43210",
  whatsappNumber = "919876543210",
  brandName = "Sivakasi Sparklers",
}: ProductDetailClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeSpark, setActiveSpark] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const triggerSpark = useCartStore((state) => state.triggerSpark);

  const isAvailable =
    product.availability === "IN_STOCK" || product.availability === "LIMITED";
  const discountPercent = calculateDiscountPercent(product.mrpPaise, product.pricePaise);

  const currentImg =
    product.images[selectedImageIndex]?.url ||
    product.images[0]?.url ||
    `/placeholders/${product.category.slug}.svg`;

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
        image: currentImg,
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

  const cleanPhone = phone.replace(/[^0-9+]/g, "");
  const cleanWa = whatsappNumber.replace(/[^0-9]/g, "");
  const waEnquiryText = encodeURIComponent(
    `Hello ${brandName}, I would like to enquire about ${product.name} (${product.sku}) - Price: ${formatPaise(product.pricePaise)}`
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start mb-16">
      <SparkBurst active={activeSpark} />

      {/* Column 1: Image Gallery */}
      <div className="flex flex-col gap-4">
        {/* Main Display Image */}
        <div className="relative w-full aspect-square rounded-3xl bg-bg-1 border border-white/10 overflow-hidden flex items-center justify-center p-6 shadow-2xl">
          <Image
            src={currentImg}
            alt={product.name}
            fill
            priority
            className="object-contain p-4 hover:scale-105 transition-transform duration-300"
          />
          {/* Availability Badge */}
          <div className="absolute top-4 left-4">
            {isAvailable ? (
              <Badge variant="success">In Stock</Badge>
            ) : (
              <Badge variant="danger">Out of Stock</Badge>
            )}
          </div>
        </div>

        {/* Thumbnail Selector */}
        {product.images.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                  selectedImageIndex === idx
                    ? "border-accent-magenta scale-105"
                    : "border-white/10 opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={img.url} alt="Thumbnail" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Column 2: Product Specifications and Actions */}
      <div className="flex flex-col">
        {/* Category Badge & SKU */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <Badge
            variant="gradient"
            colorFrom={product.category.colorFrom}
            colorTo={product.category.colorTo}
          >
            {product.category.name}
          </Badge>
          <span className="font-mono text-xs font-bold text-accent-magenta">
            SKU: {product.sku}
          </span>
        </div>

        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-foreground mb-2">
          {product.name}
        </h1>

        <p className="text-sm text-text-muted mb-6">
          Pack Size: <strong className="text-foreground">{product.packSize}</strong> ({product.unit})
        </p>

        {/* Pricing Block */}
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 mb-6 flex items-baseline gap-4">
          <div>
            <span className="text-xs text-text-muted block mb-0.5">Enquiry Estimate</span>
            <span className="font-heading font-extrabold text-3xl sm:text-4xl text-accent-gold">
              {formatPaise(product.pricePaise)}
            </span>
          </div>
          {product.mrpPaise > product.pricePaise && (
            <div className="flex flex-col">
              <span className="text-xs text-text-muted/60 line-through">
                MRP: {formatPaise(product.mrpPaise)}
              </span>
              <span className="text-xs font-bold text-accent-lime">
                Save {discountPercent}%
              </span>
            </div>
          )}
        </div>

        {/* Short Description */}
        {product.shortDesc && (
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6">
            {product.shortDesc}
          </p>
        )}

        {/* Quantity Stepper & Add to Enquiry */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-between rounded-xl bg-white/10 border border-white/10 p-1 min-h-[44px]">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              disabled={!isAvailable}
              className="p-2 text-text-muted hover:text-foreground disabled:opacity-40 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center text-sm font-bold text-foreground">
              {qty}
            </span>
            <button
              onClick={() => setQty(qty + 1)}
              disabled={!isAvailable}
              className="p-2 text-text-muted hover:text-foreground disabled:opacity-40 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={handleAdd}
            disabled={!isAvailable}
            variant={isAvailable ? "primary" : "outline"}
            size="lg"
            className="flex-1 font-bold flex items-center justify-center gap-2 shadow-xl shadow-accent-magenta/20 min-h-[44px]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isAvailable ? "Add to Enquiry" : "Currently Out of Stock"}</span>
          </Button>
        </div>

        {/* Direct WhatsApp and Phone Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <a
            href={`https://wa.me/${cleanWa}?text=${waEnquiryText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-bold transition-colors min-h-[44px]"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Enquiry</span>
          </a>
          <a
            href={`tel:${cleanPhone}`}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-foreground border border-white/10 text-xs font-bold transition-colors min-h-[44px]"
          >
            <Phone className="w-4 h-4 text-accent-gold" />
            <span>Call to Verify</span>
          </a>
        </div>

        {/* Statutory Safety Note */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-amber-300 mb-0.5">Safety & Handling:</strong>
            Always ignite outdoors in an open space under adult supervision. Keep a bucket of water or sand nearby. Maintain at least 5 metres distance after lighting.
          </div>
        </div>
      </div>
    </div>
  );
}
