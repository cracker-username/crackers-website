"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, ShoppingBag, Check } from "lucide-react";
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

  const addItem = useCartStore((state) => state.addItem);
  const triggerSpark = useCartStore((state) => state.triggerSpark);

  const getQty = (id: string) => quantities[id] || 1;
  const setQty = (id: string, val: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, Math.min(9999, val)) }));
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
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-bg-1 border border-white/10 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs md:text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-bg-0/60 text-text-muted font-heading font-bold uppercase text-[11px] tracking-wider">
              <th className="py-3.5 px-4 min-w-[200px] sticky left-0 z-10 bg-bg-1/95 backdrop-blur-sm sm:static sm:bg-transparent">
                Product
              </th>
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
                  {/* Sticky First Column on mobile */}
                  <td className="py-3 px-4 sticky left-0 z-10 bg-bg-1 sm:static sm:bg-transparent">
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
                          className="font-semibold text-foreground hover:text-accent-gold transition-colors truncate block max-w-[180px] sm:max-w-xs"
                        >
                          {p.name}
                        </Link>
                        <span className="sm:hidden text-[10px] text-text-muted">
                          {p.packSize}
                        </span>
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
  );
}
