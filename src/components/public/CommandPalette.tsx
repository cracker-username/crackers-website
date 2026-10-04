"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Plus, Sparkles, ArrowRight } from "lucide-react";
import { formatPaise } from "@/lib/utils/money";
import { useCartStore } from "@/store/useCartStore";

interface SearchResultItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  packSize: string;
  unit: string;
  pricePaise: number;
  mrpPaise: number;
  image?: string;
  slug: string;
  colorFrom?: string;
  colorTo?: string;
}

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const addItem = useCartStore((state) => state.addItem);
  const triggerSpark = useCartStore((state) => state.triggerSpark);

  // Keyboard shortcut Ctrl+K and '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
        }
      }
      if (
        e.key === "/" &&
        !isOpen &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        // open
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search query (200ms)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok && Array.isArray(json.data)) {
            setResults(json.data);
          }
        }
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Catalogue"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-bg-1 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-accent-magenta shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, SKU (e.g. SP-01), category or sound..."
            className="w-full bg-transparent text-foreground placeholder:text-text-muted/60 text-sm md:text-base outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-text-muted hover:text-foreground rounded"
              aria-label="Clear Search Input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] bg-white/10 text-text-muted rounded border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading && (
            <div className="p-8 text-center text-text-muted text-sm flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-accent-magenta" />
              <span>Searching Sivakasi catalogue...</span>
            </div>
          )}

          {!isLoading && query.trim() && results.length === 0 && (
            <div className="p-8 text-center text-text-muted text-sm">
              No crackers found matching &ldquo;{query}&rdquo;. Try searching for &ldquo;Sparkler&rdquo;, &ldquo;Pot&rdquo;, or &ldquo;Rocket&rdquo;.
            </div>
          )}

          {!isLoading && !query.trim() && (
            <div className="p-6 text-center text-xs text-text-muted">
              Type to search 80+ authentic Sivakasi firecrackers, sparklers, flower pots, and combos.
            </div>
          )}

          {results.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-colors gap-3"
            >
              <Link
                href={`/products/${item.slug}`}
                onClick={onClose}
                className="flex items-center gap-3 min-w-0 flex-1"
              >
                <div className="w-12 h-12 rounded-lg bg-bg-0 border border-white/10 overflow-hidden relative shrink-0">
                  <Image
                    src={item.image || "/placeholders/sparklers.svg"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-accent-magenta">{item.sku}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-text-muted">
                      {item.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground truncate">{item.name}</h4>
                  <p className="text-xs text-text-muted">{item.packSize}</p>
                </div>
              </Link>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-heading font-bold text-accent-gold text-base">
                  {formatPaise(item.pricePaise)}
                </span>
                <button
                  onClick={() => {
                    addItem({
                      id: item.id,
                      name: item.name,
                      sku: item.sku,
                      packSize: item.packSize,
                      unit: item.unit,
                      pricePaise: item.pricePaise,
                      mrpPaise: item.mrpPaise,
                      image: item.image,
                      isCombo: false,
                    });
                    triggerSpark(item.id);
                  }}
                  type="button"
                  className="p-2 rounded-xl bg-gradient-to-r from-accent-magenta to-accent-orange text-white hover:brightness-110 active:scale-95 transition-all shadow-md"
                  aria-label={`Add ${item.name} to enquiry`}
                  title="Add to enquiry"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/10 bg-bg-0/50 flex items-center justify-between text-xs text-text-muted">
          <span>Search Sivakasi Fireworks</span>
          <Link
            href="/price-list"
            onClick={onClose}
            className="flex items-center gap-1 text-accent-gold hover:underline font-semibold"
          >
            <span>Open Full Price List</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
