"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";

export function AgeConsentModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const isVerified = localStorage.getItem("age_verified_18");
    if (!isVerified) {
      setIsOpen(true);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem("age_verified_18", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-modal-title"
      aria-describedby="age-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-bg-1 border border-white/15 shadow-2xl text-center">
        {/* Emblem */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-accent-orange/15 border border-accent-orange/30 flex items-center justify-center text-accent-orange mb-5">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 id="age-modal-title" className="font-heading font-extrabold text-2xl text-foreground mb-3">
          Statutory Age & Safety Verification
        </h2>

        <div id="age-modal-desc" className="text-xs sm:text-sm text-text-muted leading-relaxed space-y-3 mb-6 text-left bg-white/[0.03] p-4 rounded-xl border border-white/5">
          <p>
            Under the <strong>Indian Explosives Act</strong> and state fireworks regulations, crackers may only be enquired about and purchased by adults aged <strong>18 years or older</strong>.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-text-muted/90 text-xs">
            <li>This website is an informational price list and catalogue for offline quotation purposes.</li>
            <li>No online payments or direct courier delivery are processed.</li>
            <li>All products must be handled responsibly under adult supervision.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={handleConfirm}
            variant="primary"
            size="lg"
            className="w-full sm:w-auto font-bold flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>I am 18+ & Agree to Safety Terms</span>
          </Button>
        </div>

        <p className="mt-4 text-[11px] text-text-muted/60">
          Your confirmation is remembered on this device for future visits.
        </p>
      </div>
    </div>
  );
}
