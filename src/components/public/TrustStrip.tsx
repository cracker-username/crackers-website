import React from "react";
import { ShieldCheck, Truck, Sparkles, Award } from "lucide-react";

interface TrustStripProps {
  licenseNumber?: string;
  shippingWording?: string;
}

export function TrustStrip({ licenseNumber, shippingWording }: TrustStripProps) {
  const items = [
    {
      icon: Sparkles,
      title: "100% Genuine Sivakasi Make",
      desc: "Authentic festival formulation manufactured in Sivakasi",
    },
    {
      icon: Truck,
      title: "Dedicated Surface Transport",
      desc: shippingWording || "Dispatched via verified cargo carriers to district hubs",
    },
    {
      icon: ShieldCheck,
      title: "Statutory Compliance",
      desc: "Licensed fireworks distribution adhering to Explosives Act norms",
    },
    ...(licenseNumber && licenseNumber.trim().length > 0
      ? [
          {
            icon: Award,
            title: "Verified Licence",
            desc: `Licence No: ${licenseNumber}`,
          },
        ]
      : []),
  ];

  return (
    <section
      aria-label="Trust and Verification Badges"
      className="w-full py-6 md:py-8 bg-bg-1/40 border-y border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center shrink-0 text-accent-gold">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground mb-0.5">{item.title}</h2>
                  <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
