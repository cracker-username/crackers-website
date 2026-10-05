"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { FloatingWhatsApp } from "./FloatingWhatsApp";
import { AnnouncementBar } from "./AnnouncementBar";
import { EnquiryDrawer } from "./EnquiryDrawer";
import { CommandPalette } from "./CommandPalette";
import { AgeConsentModal } from "./AgeConsentModal";
import { Footer } from "./Footer";
import { StickyEnquiryBar } from "./StickyEnquiryBar";
import { useCartStore } from "@/store/useCartStore";

import { DEFAULT_SITE_CONFIG } from "@/lib/settings/siteConfig";

interface ClientShellProps {
  children: React.ReactNode;
  brandName?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  address?: string;
  hours?: string;
  licenseNumber?: string;
  announcementText?: string;
  announcementEnabled?: boolean;
}

export function ClientShell({
  children,
  brandName = DEFAULT_SITE_CONFIG.name,
  phone = DEFAULT_SITE_CONFIG.phone,
  whatsappNumber = DEFAULT_SITE_CONFIG.whatsappNumber,
  email = DEFAULT_SITE_CONFIG.email,
  address = DEFAULT_SITE_CONFIG.address,
  hours = DEFAULT_SITE_CONFIG.hours,
  licenseNumber = DEFAULT_SITE_CONFIG.licenseNumber,
  announcementText = "🎆 Sivakasi Direct 2026 Festival Enquiries Open — Authentic Crackers at Factory Estimates!",
  announcementEnabled = true,
}: ClientShellProps) {
  const safeBrandName = (!brandName || brandName === "[BRAND_NAME]") ? DEFAULT_SITE_CONFIG.name : brandName;
  const safePhone = (!phone || phone.includes("98765")) ? DEFAULT_SITE_CONFIG.phone : phone;
  const safeWa = (!whatsappNumber || whatsappNumber.includes("98765")) ? DEFAULT_SITE_CONFIG.whatsappNumber : whatsappNumber;
  const safeEmail = (!email || email.includes("crackers.local")) ? DEFAULT_SITE_CONFIG.email : email;
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const pathname = usePathname();

  const isHydrated = useCartStore((state) => state.isHydrated);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const hasStickyBar = isHydrated && totalItems > 0 && !pathname?.startsWith("/enquiry");

  if (pathname?.startsWith("/admin")) {
    return <div className="min-h-screen bg-bg-0 text-foreground">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-0 text-foreground selection:bg-accent-magenta selection:text-white">
      {/* 1. Announcement Bar */}
      <AnnouncementBar
        text={announcementText}
        enabled={announcementEnabled}
        ctaText="View Price List"
        ctaUrl="/price-list"
      />

      {/* 2. Global Sticky Header */}
      <Header
        brandName={safeBrandName}
        whatsappNumber={safeWa}
        phone={safePhone}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenEnquiryDrawer={() => setIsEnquiryOpen(true)}
      />

      {/* 3. Main Page Content */}
      <div className="flex-1 flex flex-col">{children}</div>

      {/* 4. Global Footer */}
      <Footer
        brandName={safeBrandName}
        phone={safePhone}
        whatsappNumber={safeWa}
        email={safeEmail}
        address={address}
        hours={hours}
        licenseNumber={licenseNumber}
      />

      {/* 5. Sticky Bottom Enquiry Bar (when cart has items) */}
      <StickyEnquiryBar />

      {/* 6. Mobile Bottom Navigation */}
      <MobileNav
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenEnquiryDrawer={() => setIsEnquiryOpen(true)}
      />

      {/* 7. Floating WhatsApp Button */}
      <FloatingWhatsApp
        whatsappNumber={safeWa}
        brandName={safeBrandName}
        hasStickyBar={hasStickyBar}
      />

      {/* 7. Search Command Palette Modal */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* 8. Slide-out Enquiry Drawer */}
      <EnquiryDrawer
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
      />

      {/* 9. Statutory 18+ Age Verification Modal */}
      <AgeConsentModal />
    </div>
  );
}
