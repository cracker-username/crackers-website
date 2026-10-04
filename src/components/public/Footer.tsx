import React from "react";
import Link from "next/link";
import { Sparkles, Phone, Mail, MapPin, Clock, ArrowUp, Shield } from "lucide-react";

interface FooterProps {
  brandName?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  address?: string;
  hours?: string;
  licenseNumber?: string;
}

export function Footer({
  brandName = "Sivakasi Sparklers",
  phone = "+91 98765 43210",
  whatsappNumber = "919876543210",
  email = "contact@crackers.local",
  address = "Sivakasi, Tamil Nadu 626123, India",
  hours = "Mon - Sat: 9:00 AM - 9:00 PM IST",
  licenseNumber = "",
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-bg-1 border-t border-white/10 pt-12 pb-24 lg:pb-12 text-text-muted text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Brand Info & Sivakasi Heritage */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-magenta to-accent-orange flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-heading font-extrabold text-lg text-foreground tracking-tight">
                {brandName}
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-text-muted">
              Direct Sivakasi festival crackers catalogue and enquiry estimation platform.
              All products are sourced directly from certified Sivakasi manufacturers.
            </p>
            {licenseNumber && licenseNumber.trim().length > 0 && (
              <div className="inline-flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 text-xs text-accent-gold">
                <Shield className="w-4 h-4 shrink-0" />
                <span>Explosives Licence: {licenseNumber}</span>
              </div>
            )}
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-heading font-bold text-foreground text-sm uppercase tracking-wider mb-4">
              Catalogue & Ordering
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/price-list" className="hover:text-accent-gold transition-colors">
                  Price List (Cards & Table)
                </Link>
              </li>
              <li>
                <Link href="/combos" className="hover:text-accent-gold transition-colors">
                  Festival Combo Packs
                </Link>
              </li>
              <li>
                <Link href="/track-enquiry" className="hover:text-accent-gold transition-colors">
                  Track Your Enquiry
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-accent-gold transition-colors">
                  Fireworks Safety Guide
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-accent-gold transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Statutory */}
          <div>
            <h4 className="font-heading font-bold text-foreground text-sm uppercase tracking-wider mb-4">
              Policies & Compliance
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/legal/terms" className="hover:text-accent-gold transition-colors">
                  Terms of Enquiry
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-accent-gold transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/delivery-policy" className="hover:text-accent-gold transition-colors">
                  Delivery & Logistics Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/compliance" className="hover:text-accent-gold transition-colors">
                  Supreme Court & Statutory Notice
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-accent-gold transition-colors opacity-60">
                  Staff Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Sivakasi Coordinates */}
          <div>
            <h4 className="font-heading font-bold text-foreground text-sm uppercase tracking-wider mb-4">
              Contact & Enquiries
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-accent-magenta shrink-0 mt-0.5" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-accent-gold shrink-0" />
                <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="hover:text-foreground">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-4 h-4 text-emerald-400 font-bold shrink-0 text-center text-xs">WA</span>
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  +{whatsappNumber}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-accent-cyan shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-foreground">
                  {email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-accent-lime shrink-0" />
                <span>{hours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Statutory Compliance Banner */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 mb-8 text-[11px] leading-relaxed text-text-muted/80">
          <p className="font-semibold text-foreground/90 mb-1">
            ⚠️ Legal Notice on Fireworks Commercial Operations:
          </p>
          <p>
            In strict compliance with Supreme Court orders and Indian regulatory provisions, fireworks
            cannot be sold through direct online payment or courier parcel networks. This website operates
            exclusively as an informational product price-list catalogue and enquiry quotation generator.
            All enquiries are fulfilled offline and dispatched through approved surface cargo carriers.
          </p>
        </div>

        {/* Bottom Bar & Back to Top */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {currentYear} {brandName}. All rights reserved.</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-foreground transition-colors"
            aria-label="Back to Top"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
