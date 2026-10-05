"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Search,
  ShoppingCart,
  Phone,
  MessageCircle,
  Menu,
  X,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { ThemeToggle } from "../ui/ThemeToggle";
import { DEFAULT_SITE_CONFIG } from "@/lib/settings/siteConfig";

interface HeaderProps {
  brandName?: string;
  whatsappNumber?: string;
  phone?: string;
  onOpenSearch?: () => void;
  onOpenEnquiryDrawer?: () => void;
}

export function Header({
  brandName = DEFAULT_SITE_CONFIG.name,
  whatsappNumber = DEFAULT_SITE_CONFIG.whatsappNumber,
  phone = DEFAULT_SITE_CONFIG.phone,
  onOpenSearch,
  onOpenEnquiryDrawer,
}: HeaderProps) {
  const safeBrandName = (!brandName || brandName === "[BRAND_NAME]") ? DEFAULT_SITE_CONFIG.name : brandName;
  const safePhone = (!phone || phone.includes("98765")) ? DEFAULT_SITE_CONFIG.phone : phone;
  const safeWa = (!whatsappNumber || whatsappNumber.includes("98765")) ? DEFAULT_SITE_CONFIG.whatsappNumber : whatsappNumber;
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const totalItems = useCartStore((state) => state.getTotalItems());
  const isHydrated = useCartStore((state) => state.isHydrated);
  const lastAddedItemId = useCartStore((state) => state.lastAddedItemId);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Collections", href: "/collections/one-sound-crackers" },
    { name: "Combos", href: "/combos" },
    { name: "Price List", href: "/price-list" },
    { name: "About", href: "/about" },
    { name: "FAQ", href: "/faq" },
    { name: "Contact", href: "/contact" },
  ];

  const cleanPhone = safePhone.replace(/[^0-9+]/g, "");
  const cleanWa = safeWa.replace(/[^0-9]/g, "");

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "bg-bg-0/90 backdrop-blur-md border-b border-white/10 shadow-lg"
          : "bg-bg-0/60 backdrop-blur-sm border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-accent-magenta rounded-lg p-1"
          aria-label={`${safeBrandName} Home`}
        >
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-accent-magenta via-accent-orange to-accent-gold flex items-center justify-center text-white shadow-md shadow-accent-magenta/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-lg md:text-xl text-foreground tracking-tight leading-none group-hover:text-accent-gold transition-colors">
              {safeBrandName}
            </span>
            <span className="text-[10px] md:text-xs font-semibold text-accent-gold tracking-wider uppercase">
              Sivakasi Direct
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden lg:flex items-center gap-6"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-semibold transition-colors duration-150 py-1 border-b-2 ${
                  isActive
                    ? "text-accent-gold border-accent-gold"
                    : "text-text-muted hover:text-foreground border-transparent"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            type="button"
            className="p-2 text-text-muted hover:text-foreground hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-magenta"
            aria-label="Search crackers (Ctrl+K)"
            title="Search (Ctrl+K)"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* WhatsApp Direct Callout (Desktop) */}
          <a
            href={`https://wa.me/${cleanWa}?text=Hello%20${encodeURIComponent(safeBrandName)},%20I%20have%20an%20enquiry%20regarding%20crackers.`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-full text-xs font-bold transition-colors"
            aria-label="WhatsApp Enquiry"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span className="hidden xl:inline">WhatsApp</span>
          </a>

          {/* Phone Call Callout (Desktop) */}
          <a
            href={`tel:${cleanPhone}`}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-foreground border border-white/15 rounded-full text-xs font-bold transition-colors"
            aria-label={`Call ${safePhone}`}
          >
            <Phone className="w-3.5 h-3.5 text-accent-gold" />
            <span className="hidden xl:inline">Call Us</span>
          </a>

          {/* Enquiry Button with prominent text and count (Section 10 compliant) */}
          <button
            onClick={onOpenEnquiryDrawer}
            type="button"
            className={`relative flex items-center gap-2 px-3 py-2 rounded-full bg-accent-magenta/15 hover:bg-accent-magenta/25 border border-accent-magenta/30 text-accent-magenta focus:outline-none focus:ring-2 focus:ring-accent-magenta transition-all text-xs font-bold ${
              lastAddedItemId ? "animate-badge-bump" : ""
            }`}
            aria-label={`View Enquiry List (${isHydrated ? totalItems : 0} items)`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Enquiry</span>
            <span className="bg-gradient-to-r from-accent-magenta to-accent-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-md">
              {isHydrated ? totalItems : 0}
            </span>
          </button>

          {/* Mobile Hamburger Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="lg:hidden p-2 text-text-muted hover:text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-magenta min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={mobileMenuOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-bg-1 border-b border-white/10 px-4 pt-3 pb-6 animate-fadeIn">
          <nav className="flex flex-col gap-2" aria-label="Mobile Navigation Drawer">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-xl text-base font-semibold transition-colors ${
                    isActive
                      ? "bg-accent-magenta/20 text-accent-gold"
                      : "text-text-muted hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <a
                href={`tel:${cleanPhone}`}
                className="flex items-center gap-2 text-sm font-bold text-accent-gold"
              >
                <Phone className="w-4 h-4" />
                <span>Call Us</span>
              </a>
              <a
                href={`https://wa.me/${cleanWa}?text=Hello%20${encodeURIComponent(safeBrandName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-bold text-emerald-400 min-h-[44px]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
