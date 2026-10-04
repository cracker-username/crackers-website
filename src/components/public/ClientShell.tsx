"use client";

import React, { useState } from "react";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { FloatingWhatsApp } from "./FloatingWhatsApp";
import { AnnouncementBar } from "./AnnouncementBar";
import { EnquiryDrawer } from "./EnquiryDrawer";
import { CommandPalette } from "./CommandPalette";
import { AgeConsentModal } from "./AgeConsentModal";
import { Footer } from "./Footer";

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
  brandName = "Sivakasi Sparklers",
  phone = "+91 98765 43210",
  whatsappNumber = "919876543210",
  email = "contact@crackers.local",
  address = "Sivakasi, Tamil Nadu 626123, India",
  hours = "Mon - Sat: 9:00 AM - 9:00 PM IST",
  licenseNumber = "",
  announcementText = "🎆 Sivakasi Direct 2026 Festival Enquiries Open — Authentic Crackers at Sivakasi Estimates!",
  announcementEnabled = true,
}: ClientShellProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

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
        brandName={brandName}
        whatsappNumber={whatsappNumber}
        phone={phone}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenEnquiryDrawer={() => setIsEnquiryOpen(true)}
      />

      {/* 3. Main Page Content */}
      <div className="flex-1 flex flex-col">{children}</div>

      {/* 4. Global Footer */}
      <Footer
        brandName={brandName}
        phone={phone}
        whatsappNumber={whatsappNumber}
        email={email}
        address={address}
        hours={hours}
        licenseNumber={licenseNumber}
      />

      {/* 5. Mobile Bottom Navigation */}
      <MobileNav
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenEnquiryDrawer={() => setIsEnquiryOpen(true)}
      />

      {/* 6. Floating WhatsApp Button */}
      <FloatingWhatsApp
        whatsappNumber={whatsappNumber}
        brandName={brandName}
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
