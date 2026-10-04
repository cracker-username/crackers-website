"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatPaise } from "@/lib/utils/money";
import { Button } from "../ui/Button";

interface EnquiryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  statesList?: Array<{ code: string; name: string }>;
}

export function EnquiryDrawer({
  isOpen,
  onClose,
  statesList = [
    { code: "TN", name: "Tamil Nadu" },
    { code: "PY", name: "Puducherry" },
    { code: "KA", name: "Karnataka" },
    { code: "KL", name: "Kerala" },
    { code: "AP", name: "Andhra Pradesh" },
    { code: "TS", name: "Telangana" },
    { code: "MH", name: "Maharashtra" },
    { code: "DL", name: "Delhi (NCT)" },
  ],
}: EnquiryDrawerProps) {
  const items = useCartStore((state) => state.items);
  const selectedState = useCartStore((state) => state.selectedState);
  const setSelectedState = useCartStore((state) => state.setSelectedState);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotalPaise = useCartStore((state) => state.getSubtotalPaise());
  const totalItems = useCartStore((state) => state.getTotalItems());
  const isHydrated = useCartStore((state) => state.isHydrated);

  // Dynamic minimum order calculation
  // Tamil Nadu & Puducherry: ₹3,000 (300000 paise); Others: ₹5,000 (500000 paise)
  const isTNorPY =
    selectedState.toLowerCase() === "tamil nadu" ||
    selectedState.toLowerCase() === "puducherry" ||
    selectedState === "TN" ||
    selectedState === "PY";
  const minOrderPaise = isTNorPY ? 300000 : 500000;

  const isMinMet = subtotalPaise >= minOrderPaise;
  const shortfallPaise = Math.max(0, minOrderPaise - subtotalPaise);
  const progressPercent = Math.min(100, Math.round((subtotalPaise / minOrderPaise) * 100));

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="fixed inset-y-0 right-0 max-w-full flex pl-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-screen max-w-md bg-bg-1 border-l border-white/10 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-accent-magenta/15 text-accent-magenta">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 id="drawer-title" className="font-heading font-extrabold text-lg text-foreground">
                  Enquiry List
                </h3>
                <p className="text-xs text-text-muted">
                  {isHydrated ? totalItems : 0} items added
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-lg text-text-muted hover:text-foreground hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-magenta"
              aria-label="Close Enquiry Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Location Selector & Minimum Order Progress */}
          <div className="p-4 bg-bg-0/60 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="drawer-state-select" className="text-xs font-semibold text-text-muted">
                Delivery Location:
              </label>
              <select
                id="drawer-state-select"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="text-xs font-bold bg-white/10 border border-white/15 rounded-lg px-2.5 py-1 text-foreground outline-none focus:ring-2 focus:ring-accent-magenta"
              >
                {statesList.map((st) => (
                  <option key={st.code} value={st.name} className="bg-bg-1 text-foreground">
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-text-muted">
                  Min. Order Progress:{" "}
                  <strong className="text-accent-gold">{formatPaise(subtotalPaise)}</strong> /{" "}
                  {formatPaise(minOrderPaise)}
                </span>
                {isMinMet ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Reached
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formatPaise(shortfallPaise)} more
                  </span>
                )}
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isMinMet
                      ? "bg-gradient-to-r from-emerald-500 to-accent-lime"
                      : "bg-gradient-to-r from-accent-magenta to-accent-orange"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-text-muted/70 mt-1">
                {isTNorPY
                  ? "Tamil Nadu & Puducherry minimum enquiry: ₹3,000"
                  : "All other states minimum enquiry: ₹5,000 for cargo transport"}
              </p>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!isHydrated || items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted">
                <ShoppingBag className="w-12 h-12 text-white/20 mb-3" />
                <h4 className="font-heading font-bold text-base text-foreground mb-1">
                  Your enquiry list is empty
                </h4>
                <p className="text-xs max-w-xs mb-5">
                  Browse our Sivakasi fireworks price list and add items with your desired quantities.
                </p>
                <Link href="/price-list" onClick={onClose}>
                  <Button variant="primary" size="md">
                    Explore Price List
                  </Button>
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="w-14 h-14 rounded-lg bg-bg-0 border border-white/10 overflow-hidden relative shrink-0">
                    <Image
                      src={item.image || "/placeholders/sparklers.svg"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-sm font-semibold text-foreground truncate">{item.name}</h5>
                    <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                      <span>{item.sku}</span>
                      <span>•</span>
                      <span>{item.packSize}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-accent-gold text-xs">
                        {formatPaise(item.pricePaise)} each
                      </span>
                      <span className="font-bold text-foreground text-xs">
                        {formatPaise(item.pricePaise * item.quantity)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-text-muted hover:text-rose-400 p-1 transition-colors"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="inline-flex items-center rounded-lg bg-white/10 border border-white/10">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:text-accent-gold transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:text-accent-gold transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer Actions */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-white/10 bg-bg-0/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Estimated Subtotal:</span>
                <span className="font-heading font-extrabold text-xl text-accent-gold">
                  {formatPaise(subtotalPaise)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={clearCart}
                  className="px-3 py-2 text-xs text-text-muted hover:text-rose-400 border border-white/10 rounded-xl transition-colors shrink-0"
                >
                  Clear All
                </button>
                <Link href="/enquiry" onClick={onClose} className="flex-1">
                  <Button
                    variant={isMinMet ? "primary" : "secondary"}
                    size="lg"
                    className="w-full font-bold flex items-center justify-center gap-2"
                  >
                    <span>Review Enquiry</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              <p className="text-[11px] text-center text-text-muted/70">
                Offline estimation tool. No online payment required.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
