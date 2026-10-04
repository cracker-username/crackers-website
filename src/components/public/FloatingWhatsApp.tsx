"use client";

import React from "react";
import { MessageCircle } from "lucide-react";

interface FloatingWhatsAppProps {
  whatsappNumber?: string;
  brandName?: string;
  hasStickyBar?: boolean;
}

export function FloatingWhatsApp({
  whatsappNumber = "919876543210",
  brandName = "Sivakasi Sparklers",
  hasStickyBar = false,
}: FloatingWhatsAppProps) {
  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
  const defaultText = encodeURIComponent(
    `Hello ${brandName}, I would like to enquire about crackers availability.`
  );

  return (
    <aside aria-label="Quick WhatsApp Assistance">
      <a
        href={`https://wa.me/${cleanNumber}?text=${defaultText}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed z-30 flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-xl shadow-emerald-950/40 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 right-4 ${
          hasStickyBar ? "bottom-[124px] lg:bottom-8 lg:right-8" : "bottom-[68px] lg:bottom-8 lg:right-8"
        }`}
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
