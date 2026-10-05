import React from "react";
import { Metadata } from "next";
import { ShieldAlert, CheckCircle, XCircle, Flame, Droplets } from "lucide-react";
import { DEFAULT_SITE_CONFIG } from "@/lib/settings/siteConfig";

export const metadata: Metadata = {
  title: `Fireworks Safety Guidelines — ${DEFAULT_SITE_CONFIG.name}`,
  description:
    "Crucial safety precautions, lighting dos and don'ts, and emergency guidelines for a safe festival celebration.",
};

export default function SafetyPage() {
  return (
    <div className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-32 text-text-muted">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-orange/15 border border-accent-orange/30 text-accent-orange text-xs font-bold uppercase tracking-wider mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>STATUTORY SAFETY INSTRUCTIONS</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-foreground mb-4">
          Fireworks Safety Guidelines
        </h1>
        <p className="text-sm md:text-base leading-relaxed max-w-xl mx-auto">
          Celebrate Diwali and festivals with joy, responsibility, and vigilance. Please follow these verified precautions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Do's Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-bg-1 border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-extrabold text-xl text-emerald-400">DO&apos;S (Always Follow)</h2>
          </div>
          <ul className="space-y-3.5 text-xs sm:text-sm leading-relaxed">
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Always light fireworks in open outdoor areas away from buildings, vehicles, and overhead wires.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Keep buckets of clean water and dry sand nearby before igniting any firework.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Always supervise children closely; ensure fireworks are only handled under adult guidance.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Wear snug cotton clothing and closed footwear while handling fireworks.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Maintain a minimum distance of at least 5 metres immediately after igniting the fuse.</span>
            </li>
          </ul>
        </div>

        {/* Don'ts Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-bg-1 border border-rose-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-extrabold text-xl text-rose-400">DON&apos;TS (Never Do)</h2>
          </div>
          <ul className="space-y-3.5 text-xs sm:text-sm leading-relaxed">
            <li className="flex items-start gap-2.5">
              <span className="text-rose-400 font-bold">✗</span>
              <span>NEVER attempt to re-ignite or examine a firework that failed to burst initially. Wait 15 minutes, then douse with water.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-rose-400 font-bold">✗</span>
              <span>NEVER hold fireworks in hand while igniting (except handle sparklers held by adults).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-rose-400 font-bold">✗</span>
              <span>NEVER light fireworks inside houses, corridors, balconies, or narrow covered alleys.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-rose-400 font-bold">✗</span>
              <span>NEVER wear loose synthetic, silk, or nylon clothing near open flames.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-rose-400 font-bold">✗</span>
              <span>NEVER store fireworks near cooking gas cylinders, stoves, or electrical switchboards.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Storage and Emergency Guidance */}
      <div className="p-6 sm:p-8 rounded-3xl bg-bg-1 border border-white/10 space-y-6">
        <div>
          <h3 className="font-heading font-bold text-lg text-foreground mb-2 flex items-center gap-2">
            <Flame className="w-5 h-5 text-accent-orange" />
            <span>Storage & Pre-Festive Handling</span>
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed">
            Keep firecracker boxes in a dry, cool, well-ventilated location strictly out of reach of children and pets.
            Avoid moisture or direct sun exposure, which can compromise fuse stability.
          </p>
        </div>

        <div className="pt-4 border-t border-white/5">
          <h3 className="font-heading font-bold text-lg text-foreground mb-2 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-accent-cyan" />
            <span>First-Aid in Case of Minor Burns</span>
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed">
            Immediately cool the affected area with running clean tap water for at least 10 minutes.
            Do not apply oil, butter, or harsh chemicals. Seek prompt medical assistance from a doctor or hospital immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
