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
      className="fixed bottom-[56px] lg:bottom-0 left-0 right-0 z-30 bg-bg-1/95 backdrop-blur-md border-t border-white/10 shadow-2xl py-2.5 px-4 animate-slideUp"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Progress & Subtotal */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">
                {totalItems} {totalItems === 1 ? "item" : "items"} • Subtotal:
              </span>
              <span className="font-heading font-extrabold text-base md:text-lg text-accent-gold">
                {formatPaise(subtotalPaise)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              {isMinMet ? (
                <span className="text-emerald-400 font-bold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Min. enquiry requirement reached for {selectedState}!
                </span>
              ) : (
                <span className="text-amber-300 font-medium inline-flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Add {formatPaise(shortfallPaise)} more to reach {selectedState} minimum
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full sm:w-auto flex items-center justify-end">
          <Link href="/enquiry" className="w-full sm:w-auto">
            <Button
              variant={isMinMet ? "primary" : "secondary"}
              size="md"
              className="w-full sm:w-auto font-bold flex items-center justify-center gap-2"
            >
              <span>Review Enquiry</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
