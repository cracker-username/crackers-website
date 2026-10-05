import React from "react";
import { Metadata } from "next";
import { Sparkles, ShieldCheck, MapPin, Award } from "lucide-react";
import { DEFAULT_SITE_CONFIG } from "@/lib/settings/siteConfig";

export const metadata: Metadata = {
  title: `About ${DEFAULT_SITE_CONFIG.name} — Our Fireworks Heritage`,
  description:
    "Learn about our Sivakasi fireworks heritage, stringent quality standards, and honest festival price-list estimation process.",
};

export default function AboutPage() {
  return (
    <div className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-24 text-text-muted">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-gold/15 border border-accent-gold/30 text-accent-gold text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SIVAKASI FIREWORKS HERITAGE</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-foreground mb-4">
          About {DEFAULT_SITE_CONFIG.name}
        </h1>
        <p className="text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
          Delivering joy, vibrant colors, and authentic festival celebrations directly from the fireworks capital of India.
        </p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed">
        <div className="p-6 sm:p-8 rounded-3xl bg-bg-1 border border-white/10">
          <h2 className="font-heading font-bold text-xl text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent-magenta" />
            <span>Rooted in Sivakasi</span>
          </h2>
          <p className="mb-3">
            Sivakasi produces over 90% of India&apos;s fireworks. For generations, master pyrotechnicians have perfected
            chemical blends to create safe, low-smoke, and high-altitude colorful visual wonders.
          </p>
          <p>
            Our platform connects customers across India directly to certified Sivakasi estimates, cutting out middlemen,
            inflated retail markups, and stale storage stock.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-bg-1 border border-white/10">
          <h2 className="font-heading font-bold text-xl text-foreground mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Strict Safety & Legal Guardrails</span>
          </h2>
          <p className="mb-3">
            In compliance with Supreme Court orders and Indian explosives laws, our platform operates on an
            <strong> enquiry-first model</strong>. We do not sell firecrackers via automatic online payment gateways or postal courier.
          </p>
          <p>
            Every enquiry is reviewed manually by our Sivakasi operations team. We verify state restrictions, confirm
            transport carriers, and provide customers with transparent freight receipts.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-bg-1 border border-white/10">
          <h2 className="font-heading font-bold text-xl text-foreground mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-accent-gold" />
            <span>Factory Fresh Batches</span>
          </h2>
          <p>
            Unlike local seasonal roadside stalls that often store surplus inventory from previous years, our fireworks
            are sourced fresh each festive season, ensuring optimal spark brightness, reliable fusing, and complete safety.
          </p>
        </div>
      </div>
    </div>
  );
}
