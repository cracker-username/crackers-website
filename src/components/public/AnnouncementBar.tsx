"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

interface AnnouncementBarProps {
  text?: string;
  ctaText?: string;
  ctaUrl?: string;
  enabled?: boolean;
}

export function AnnouncementBar({
  text = "🎆 Sivakasi Direct 2026 Festival Enquiries Open — Genuine Fireworks at Sivakasi Estimates!",
  ctaText = "View Price List",
  ctaUrl = "/price-list",
  enabled = true,
}: AnnouncementBarProps) {
  if (!enabled || !text || text.trim().length === 0) {
    return null; // Never render an empty bar
  }

  return (
    <aside
      aria-label="Festival Announcement"
      className="relative z-40 w-full overflow-hidden bg-gradient-to-r from-accent-magenta via-accent-orange to-accent-magenta text-white py-2 px-4 shadow-sm"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs md:text-sm font-medium">
        {/* Marquee Wrapper with Pause on Hover */}
        <div className="flex-1 overflow-hidden whitespace-nowrap group">
          <div className="inline-flex items-center gap-6 animate-marquee group-hover:[animation-play-state:paused]">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
              <span>{text}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
              <span>{text}</span>
            </span>
          </div>
        </div>

        {/* Optional Call to Action */}
        {ctaText && ctaUrl && (
          <Link
            href={ctaUrl}
            className="hidden sm:inline-flex items-center gap-1.5 ml-4 px-3 py-1 bg-black/25 hover:bg-black/40 rounded-full font-bold text-accent-gold transition-colors shrink-0"
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </aside>
  );
}
