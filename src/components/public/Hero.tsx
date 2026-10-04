"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Clock, ShieldCheck, Flame } from "lucide-react";
import { FireworksCanvas } from "../canvas/FireworksCanvas";
import { Button } from "../ui/Button";
import { calculateTimeRemaining } from "@/lib/utils/dates";

interface HeroProps {
  headline?: string;
  supportingLine?: string;
  countdownTarget?: string;
  countdownTitle?: string;
  countdownEnabled?: boolean;
}

export function Hero({
  headline = "Authentic Sivakasi Crackers Direct Festival Estimates",
  supportingLine = "Explore 80+ handcrafted fireworks, dazzling aerial multi-shots, vibrant flower pots, and family combo packs directly from Sivakasi at honest factory estimates.",
  countdownTarget = "2026-11-08T00:00:00+05:30",
  countdownTitle = "Diwali 2026 Seasonal Enquiry Booking Closes In:",
  countdownEnabled = true,
}: HeroProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    if (!countdownEnabled || !countdownTarget) return;

    const updateCountdown = () => {
      const remaining = calculateTimeRemaining(countdownTarget);
      setTimeLeft(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [countdownTarget, countdownEnabled]);

  return (
    <section className="relative w-full overflow-hidden min-h-[580px] md:min-h-[640px] flex items-center justify-center bg-gradient-to-b from-bg-0 via-bg-1 to-bg-0 py-16 px-4 sm:px-6 lg:px-8 border-b border-white/5">
      {/* Dynamic Native Fireworks Canvas (Paused offscreen / hidden tab) */}
      <FireworksCanvas className="opacity-70" />

      {/* Decorative Radial Backdrop Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent-magenta/15 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        {/* Sivakasi Heritage Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-accent-gold text-xs font-bold tracking-wide mb-6 shadow-md">
          <Flame className="w-4 h-4 text-accent-orange animate-bounce" />
          <span>DIRECT SIVAKASI FESTIVAL CATALOGUE 2026</span>
        </div>

        {/* Hero Headline with Gradient Brand Accent */}
        <h1 className="font-heading font-extrabold text-3xl sm:text-5xl md:text-6xl text-foreground tracking-tight leading-[1.15] mb-5">
          {headline.split("Direct").map((part, i) =>
            i === 0 ? (
              <span key={i}>
                {part}
                <span className="bg-gradient-to-r from-accent-magenta via-accent-orange to-accent-gold bg-clip-text text-transparent">
                  Direct
                </span>
              </span>
            ) : (
              part
            )
          )}
        </h1>

        {/* Supporting Line */}
        <p className="text-base sm:text-lg md:text-xl text-text-muted max-w-2xl leading-relaxed mb-8">
          {supportingLine}
        </p>

        {/* Countdown Timer (Only when enabled and not expired) */}
        {countdownEnabled && !timeLeft.isExpired && (
          <div className="w-full max-w-md mx-auto mb-8 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-accent-gold mb-2 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>{countdownTitle}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-xl bg-bg-0/60 border border-white/10">
                <span className="font-heading font-extrabold text-xl sm:text-2xl text-foreground block">
                  {timeLeft.days}
                </span>
                <span className="text-[10px] text-text-muted uppercase">Days</span>
              </div>
              <div className="p-2 rounded-xl bg-bg-0/60 border border-white/10">
                <span className="font-heading font-extrabold text-xl sm:text-2xl text-foreground block">
                  {timeLeft.hours}
                </span>
                <span className="text-[10px] text-text-muted uppercase">Hours</span>
              </div>
              <div className="p-2 rounded-xl bg-bg-0/60 border border-white/10">
                <span className="font-heading font-extrabold text-xl sm:text-2xl text-foreground block">
                  {timeLeft.minutes}
                </span>
                <span className="text-[10px] text-text-muted uppercase">Mins</span>
              </div>
              <div className="p-2 rounded-xl bg-bg-0/60 border border-white/10">
                <span className="font-heading font-extrabold text-xl sm:text-2xl text-accent-gold block">
                  {timeLeft.seconds}
                </span>
                <span className="text-[10px] text-text-muted uppercase">Secs</span>
              </div>
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link href="/price-list" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto text-base font-bold flex items-center justify-center gap-2 shadow-xl shadow-accent-magenta/25"
            >
              <span>Explore Price List</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/combos" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base font-semibold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-accent-gold" />
              <span>View Combo Packs</span>
            </Button>
          </Link>
        </div>

        {/* Microcopy disclaimer */}
        <div className="flex items-center gap-2 mt-6 text-xs text-text-muted/80">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Enquiry & Estimation Only • No Online Card/Payment Processing</span>
        </div>
      </div>
    </section>
  );
}
