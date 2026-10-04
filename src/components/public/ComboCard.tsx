"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Plus, Minus, ShoppingBag, CheckCircle2 } from "lucide-react";
import { formatPaise, calculateDiscountPercent } from "@/lib/utils/money";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { SparkBurst } from "./SparkBurst";

export interface ComboCardData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  originalPaise: number;
  comboPaise: number;
  availability: "IN_STOCK" | "LIMITED" | "OUT_OF_STOCK" | "UNAVAILABLE";
  items: Array<{
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
  }>;
}

export function ComboCard({ combo }: { combo: ComboCardData }) {
  const [qty, setQty] = useState(1);
  const [activeSpark, setActiveSpark] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const triggerSpark = useCartStore((state) => state.triggerSpark);

  const isAvailable =
    combo.availability === "IN_STOCK" || combo.availability === "LIMITED";
  const savingsPercent = calculateDiscountPercent(combo.originalPaise, combo.comboPaise);

  const handleAdd = () => {
    if (!isAvailable) return;

    addItem(
      {
        id: combo.id,
        name: combo.name,
        sku: combo.slug,
        packSize: `${combo.items.length} Assorted Varieties`,
        unit: "Combo Pack",
        pricePaise: combo.comboPaise,
        mrpPaise: combo.originalPaise,
        image: combo.image || "/placeholders/gift-boxes.svg",
        isCombo: true,
      },
      qty
    );

    triggerSpark(combo.id);
    setActiveSpark(true);
    setTimeout(() => setActiveSpark(false), 600);
  };

  return (
    <div className="relative rounded-3xl bg-bg-1 border border-white/10 hover:border-white/20 transition-all duration-300 shadow-xl overflow-hidden flex flex-col group">
      <SparkBurst active={activeSpark} />

      {/* Top Gradient Ribbon */}
      <div className="h-2 w-full bg-gradient-to-r from-accent-magenta via-accent-orange to-accent-gold" />

      {/* Image & Badges */}
      <div className="relative w-full h-56 bg-bg-0 flex items-center justify-center p-6 overflow-hidden">
        <Image
          src={combo.image || "/placeholders/gift-boxes.svg"}
          alt={combo.name}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          <Badge variant="gradient" colorFrom="#FF2E93" colorTo="#FF7A18" className="text-[10px] uppercase font-bold tracking-wider">
            Festival Value Pack
          </Badge>
          {savingsPercent > 0 && (
            <Badge variant="discount" className="text-[10px]">
              Save {savingsPercent}% vs Retail
            </Badge>
          )}
        </div>
      </div>

      {/* Combo Details */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-heading font-extrabold text-xl text-foreground mb-1 group-hover:text-accent-gold transition-colors">
          {combo.name}
        </h3>

        {combo.description && (
          <p className="text-xs text-text-muted leading-relaxed mb-4">
            {combo.description}
          </p>
        )}

        {/* Pricing */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 mb-5 flex items-baseline justify-between">
          <div>
            <span className="text-[10px] text-text-muted uppercase block">Combo Estimate</span>
            <span className="font-heading font-extrabold text-2xl text-accent-gold">
              {formatPaise(combo.comboPaise)}
            </span>
          </div>
          {combo.originalPaise > combo.comboPaise && (
            <div className="text-right">
              <span className="text-[10px] text-text-muted block">Standard Value</span>
              <span className="text-xs text-text-muted/60 line-through">
                {formatPaise(combo.originalPaise)}
              </span>
            </div>
          )}
        </div>

        {/* Included Items Checklist */}
        <div className="mb-6 flex-1">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">
            Included in this pack:
          </span>
          <ul className="space-y-1.5 text-xs text-text-muted/90 bg-white/[0.02] p-3 rounded-xl border border-white/5">
            {combo.items.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">
                  {item.productName} <strong className="text-foreground">x {item.quantity}</strong>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quantity Stepper & Add Button */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/10 mt-auto">
          <div className="inline-flex items-center rounded-xl bg-white/10 border border-white/10 shrink-0">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              disabled={!isAvailable}
              type="button"
              className="p-2 hover:text-accent-gold disabled:opacity-30 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-7 text-center font-bold text-xs">
              {qty}
            </span>
            <button
              onClick={() => setQty(qty + 1)}
              disabled={!isAvailable}
              type="button"
              className="p-2 hover:text-accent-gold disabled:opacity-30 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button
            onClick={handleAdd}
            disabled={!isAvailable}
            variant="primary"
            size="md"
            className="flex-1 font-bold flex items-center justify-center gap-1.5 shadow-md shadow-accent-magenta/20 min-h-[44px]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add Combo Line</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
