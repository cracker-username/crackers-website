import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent-magenta/15 text-accent-magenta border border-accent-magenta/30 flex items-center justify-center mb-6">
        <FileSearch className="w-8 h-8" />
      </div>

      <span className="text-xs font-bold text-accent-gold uppercase tracking-widest block mb-2">
        404 — PAGE NOT FOUND
      </span>

      <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-foreground mb-4">
        Oops! This Spark Has Burned Out
      </h1>

      <p className="text-sm text-text-muted max-w-md mx-auto mb-8 leading-relaxed">
        The cracker category or page you are looking for might have been moved or is no longer listed in our festive catalogue.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/">
          <Button variant="outline" size="md" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Return Home</span>
          </Button>
        </Link>
        <Link href="/price-list">
          <Button variant="primary" size="md" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Open Price List</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
