"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, Search, ShoppingBag, PhoneCall } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

interface MobileNavProps {
  onOpenSearch?: () => void;
  onOpenEnquiryDrawer?: () => void;
}

export function MobileNav({ onOpenSearch, onOpenEnquiryDrawer }: MobileNavProps) {
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const isHydrated = useCartStore((state) => state.isHydrated);

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-1/95 backdrop-blur-md border-t border-white/10 px-2 py-1 shadow-2xl safe-area-bottom"
    >
      <div className="flex items-center justify-around">
        {/* 1. Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-colors ${
            pathname === "/" ? "text-accent-gold font-bold" : "text-text-muted hover:text-foreground"
          }`}
          aria-label="Home"
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </Link>

        {/* 2. Categories */}
        <Link
          href="/price-list"
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-colors ${
            pathname.startsWith("/collections") || pathname === "/price-list"
              ? "text-accent-gold font-bold"
              : "text-text-muted hover:text-foreground"
          }`}
          aria-label="Categories and Price List"
        >
          <Grid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Catalogue</span>
        </Link>

        {/* 3. Search Trigger */}
        <button
          onClick={onOpenSearch}
          type="button"
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 text-text-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent-magenta rounded-lg"
          aria-label="Search Crackers"
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Search</span>
        </button>

        {/* 4. Enquiry Cart Drawer Trigger with Badge */}
        <button
          onClick={onOpenEnquiryDrawer}
          type="button"
          className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-colors ${
            pathname.startsWith("/enquiry")
              ? "text-accent-magenta font-bold"
              : "text-text-muted hover:text-foreground"
          }`}
          aria-label={`Enquiry List (${isHydrated ? totalItems : 0} items)`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {isHydrated && totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-gradient-to-r from-accent-magenta to-accent-orange text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-md">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Enquiry</span>
        </button>

        {/* 5. Contact */}
        <Link
          href="/contact"
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-colors ${
            pathname === "/contact"
              ? "text-accent-gold font-bold"
              : "text-text-muted hover:text-foreground"
          }`}
          aria-label="Contact and Support"
        >
          <PhoneCall className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Contact</span>
        </Link>
      </div>
    </nav>
  );
}
