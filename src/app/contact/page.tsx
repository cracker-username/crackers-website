import React from "react";
import { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { parseSettingValue } from "@/lib/settings/registry";
import { Phone, MessageCircle, Mail, MapPin, Clock, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Contact Us — Sivakasi Sparklers Direct Enquiries",
  description:
    "Get in touch with our Sivakasi fireworks dispatch desk via Phone or WhatsApp for enquiry questions, transport feasibility, and estimates.",
};

export default async function ContactPage() {
  let brandName = "Sivakasi Sparklers";
  let phone = "+91 98765 43210";
  let whatsappNumber = "919876543210";
  let email = "contact@crackers.local";
  let address = "Sivakasi, Tamil Nadu 626123, India";
  let hours = "Mon - Sat: 9:00 AM - 9:00 PM IST";

  try {
    const settings = await prisma.setting.findMany();
    const map = new Map(settings.map((s) => [s.key, s.value]));
    if (map.has("businessName")) brandName = parseSettingValue("businessName", map.get("businessName"));
    if (map.has("phone")) phone = parseSettingValue("phone", map.get("phone"));
    if (map.has("whatsappNumber")) whatsappNumber = parseSettingValue("whatsappNumber", map.get("whatsappNumber"));
    if (map.has("email")) email = parseSettingValue("email", map.get("email"));
    if (map.has("address")) address = parseSettingValue("address", map.get("address"));
    if (map.has("hours")) hours = parseSettingValue("hours", map.get("hours"));
  } catch (e) {
    console.warn("Settings error in ContactPage:", e);
  }

  const cleanPhone = phone.replace(/[^0-9+]/g, "");
  const cleanWa = whatsappNumber.replace(/[^0-9]/g, "");

  return (
    <div className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-32">
      <div className="text-center mb-12">
        <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-foreground mb-4">
          Contact Our Sivakasi Desk
        </h1>
        <p className="text-sm md:text-base text-text-muted max-w-xl mx-auto">
          Need assistance selecting varieties or checking logistics transport to your city? Reach out to our Sivakasi team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Card 1: Direct WhatsApp */}
        <div className="p-6 sm:p-8 rounded-3xl bg-bg-1 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-xl text-foreground mb-2">WhatsApp Direct</h3>
            <p className="text-xs text-text-muted leading-relaxed mb-6">
              Send us your queries, get quick stock availability updates, and confirm your submitted enquiry instantly.
            </p>
          </div>
          <a
            href={`https://wa.me/${cleanWa}?text=Hello%20${encodeURIComponent(brandName)},%20I%20have%20an%20enquiry.`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="primary" size="lg" className="w-full font-bold">
              Chat on WhatsApp (+{cleanWa})
            </Button>
          </a>
        </div>

        {/* Card 2: Phone Calling */}
        <div className="p-6 sm:p-8 rounded-3xl bg-bg-1 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-accent-gold/15 text-accent-gold flex items-center justify-center mb-4">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-xl text-foreground mb-2">Call Our Sivakasi Office</h3>
            <p className="text-xs text-text-muted leading-relaxed mb-6">
              Speak directly with our seasonal enquiry coordinators during business hours for bulk and transport guidance.
            </p>
          </div>
          <a href={`tel:${cleanPhone}`}>
            <Button variant="secondary" size="lg" className="w-full font-bold">
              Call Us ({phone})
            </Button>
          </a>
        </div>
      </div>

      {/* Address & Hours Grid */}
      <div className="p-6 sm:p-8 rounded-3xl bg-bg-1 border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-accent-magenta shrink-0 mt-0.5" />
          <div>
            <h4 className="font-heading font-bold text-sm text-foreground mb-1">Dispatch Location</h4>
            <p className="text-xs text-text-muted leading-relaxed">{address}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-accent-lime shrink-0 mt-0.5" />
          <div>
            <h4 className="font-heading font-bold text-sm text-foreground mb-1">Operational Hours</h4>
            <p className="text-xs text-text-muted leading-relaxed">{hours}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-accent-cyan shrink-0 mt-0.5" />
          <div>
            <h4 className="font-heading font-bold text-sm text-foreground mb-1">Email Desk</h4>
            <p className="text-xs text-text-muted leading-relaxed">{email}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/faq"
          className="inline-flex items-center gap-2 text-xs font-semibold text-accent-gold hover:underline"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Have questions about minimum orders or cargo transport? Check our FAQs</span>
        </Link>
      </div>
    </div>
  );
}
