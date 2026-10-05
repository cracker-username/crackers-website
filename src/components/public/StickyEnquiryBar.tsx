"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatPaise } from "@/lib/utils/money";
import { Button } from "../ui/Button";

export function StickyEnquiryBar() {
  const pathname = usePathname();
  const isHydrated = useCartStore((state) => state.isHydrated);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const subtotalPaise = useCartStore((state) => state.getSubtotalPaise());
  const selectedState = useCartStore((state) => state.selectedState);

  if (!isHydrated || totalItems === 0 || pathname?.startsWith("/enquiry")) {
    return null; // Only render when cart has items and not already on enquiry review page
  }

  // Minimum order logic: TN/PY ₹3,000; Others ₹5,000
  const isTN =
    selectedState.toLowerCase() === "tamil nadu" ||
    selectedState.toLowerCase() === "puducherry" ||
    selectedState === "TN" ||
    selectedState === "PY";
  const minOrderPaise = isTN ? 300000 : 500000;

  const isMinMet = subtotalPaise >= minOrderPaise;
  const shortfallPaise = Math.max(0, minOrderPaise - subtotalPaise);

  return (
    <aside
      aria-label="Enquiry Cart Progress Bar"
      className="fixed z-30 bg-bg-1/95 backdrop-blur-md border-t border-white/10 shadow-2xl py-2 px-3 sm:py-2.5 sm:px-4 animate-slideUp left-0 right-0 bottom-[56px] lg:bottom-0"
      style={{
        bottom: "calc(56px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Progress & Subtotal */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-[11px] sm:text-xs text-text-muted font-medium">
              {totalItems} {totalItems === 1 ? "Item" : "Items"} •
            </span>
            <span className="font-heading font-extrabold text-sm sm:text-base text-accent-gold">
              {formatPaise(subtotalPaise)}
            </span>
          </div>
          <div className="text-[10px] sm:text-[11px] leading-tight truncate">
            {isMinMet ? (
              <span className="text-emerald-400 font-bold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>✓ Minimum requirement reached</span>
              </span>
            ) : (
              <span className="text-amber-300 font-medium inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{formatPaise(shortfallPaise)} more needed</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0">
          <Link href="/enquiry">
            <Button
              variant={isMinMet ? "primary" : "secondary"}
              size="sm"
              className="min-h-[40px] px-3 sm:px-4 font-bold flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap shadow-md"
            >
              <span>Review Enquiry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
