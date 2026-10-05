"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { DEFAULT_SITE_CONFIG } from "@/lib/settings/siteConfig";

interface FloatingWhatsAppProps {
  whatsappNumber?: string;
  brandName?: string;
  hasStickyBar?: boolean;
}

export function FloatingWhatsApp({
  whatsappNumber = DEFAULT_SITE_CONFIG.whatsappNumber,
  brandName = DEFAULT_SITE_CONFIG.name,
  hasStickyBar = false,
}: FloatingWhatsAppProps) {
  const safeBrandName = (!brandName || brandName === "[BRAND_NAME]") ? DEFAULT_SITE_CONFIG.name : brandName;
  const safeWa = (!whatsappNumber || whatsappNumber.includes("98765")) ? DEFAULT_SITE_CONFIG.whatsappNumber : whatsappNumber;
  const cleanNumber = safeWa.replace(/[^0-9]/g, "");
  const defaultText = encodeURIComponent(
    `Hello ${safeBrandName}, I would like to enquire about crackers availability.`
  );

  return (
    <aside aria-label="Quick WhatsApp Assistance">
      <a
        href={`https://wa.me/${cleanNumber}?text=${defaultText}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed z-30 flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-xl shadow-emerald-950/40 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 right-4 lg:bottom-8 lg:right-8 ${
          hasStickyBar ? "bottom-[116px]" : "bottom-[68px]"
        }`}
        style={{
          bottom: typeof window !== "undefined" && window.innerWidth >= 1024
            ? undefined
            : hasStickyBar
            ? "calc(116px + env(safe-area-inset-bottom, 0px))"
            : "calc(68px + env(safe-area-inset-bottom, 0px))",
        }}
        aria-label="Direct WhatsApp Enquiry"
      >
        <MessageCircle className="w-5 h-5 fill-current" />
        <span className="hidden sm:inline text-xs font-bold tracking-wide">
          Quick Enquiry
        </span>
      </a>
    </aside>
  );
}
