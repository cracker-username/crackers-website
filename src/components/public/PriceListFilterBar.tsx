"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  Check,
} from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  colorFrom: string;
  colorTo: string;
}

interface PriceListFilterBarProps {
  categories: CategoryOption[];
  viewMode: "cards" | "table";
  onViewChange?: (view: "cards" | "table") => void;
  totalCount: number;
}

export function PriceListFilterBar({
  categories,
  viewMode,
  onViewChange,
  totalCount,
}: PriceListFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "";
  const currentQuery = searchParams.get("q") || "";
  const currentSort = searchParams.get("sort") || "featured";
  const currentAvailability = searchParams.get("availability") || "";
  const currentFlag = searchParams.get("flag") || "";

  const [searchInput, setSearchInput] = useState(currentQuery);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Sync search input if query param changes externally
  useEffect(() => {
    setSearchInput(currentQuery);
  }, [currentQuery]);

  // Push updated query params to URL
  const updateQueryParam = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`/price-list?${params.toString()}`, { scroll: false });
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentQuery) {
        updateQueryParam({ q: searchInput ? searchInput : null });
      }
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className="w-full space-y-4">
      {/* Top Row: Search Input + Sorting + View Toggles + Mobile Filter Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-accent-magenta absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search crackers, SKU (e.g. FP-01) or description..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent-magenta transition-all"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground"
              aria-label="Clear Search Input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right Controls: Sort & Views */}
        <div className="flex items-center gap-2 self-end md:self-auto w-full md:w-auto justify-between md:justify-end">
          {/* Sorting Dropdown */}
          <select
            value={currentSort}
            onChange={(e) => updateQueryParam({ sort: e.target.value })}
            className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs md:text-sm text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-accent-magenta"
            aria-label="Sort Crackers"
          >
            <option value="featured" className="bg-bg-1">Featured</option>
            <option value="popular" className="bg-bg-1">Popular (Bestseller)</option>
            <option value="newest" className="bg-bg-1">New Arrivals</option>
            <option value="price_asc" className="bg-bg-1">Price: Low to High</option>
            <option value="price_desc" className="bg-bg-1">Price: High to Low</option>
            <option value="discount_desc" className="bg-bg-1">Highest Discount</option>
          </select>

          {/* View Toggles (Cards vs Quick Order Table) */}
          <div className="inline-flex rounded-xl bg-white/5 border border-white/10 p-1">
            <button
              onClick={() => {
                updateQueryParam({ view: "cards" });
                onViewChange?.("cards");
              }}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "cards"
                  ? "bg-accent-magenta text-white shadow-sm"
                  : "text-text-muted hover:text-foreground"
              }`}
              aria-label="Card View"
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                updateQueryParam({ view: "table" });
                onViewChange?.("table");
              }}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "table"
                  ? "bg-accent-magenta text-white shadow-sm"
                  : "text-text-muted hover:text-foreground"
              }`}
              aria-label="Quick Order Table View"
              title="Quick Order Table"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Filter Drawer Button */}
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-text-muted hover:text-foreground"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Category Chips Bar (Mobile Horizontal Scroll / Desktop Rail) */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          <button
            onClick={() => updateQueryParam({ category: null })}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              !currentCategory
                ? "bg-accent-gold text-bg-0 shadow-md font-bold"
                : "bg-white/5 text-text-muted hover:text-foreground border border-white/10"
            }`}
          >
            All Products ({totalCount})
          </button>
          {categories.map((cat) => {
            const isSelected = currentCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => updateQueryParam({ category: cat.slug })}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "text-white font-bold shadow-md"
                    : "bg-white/5 text-text-muted hover:text-foreground border border-white/10"
                }`}
                style={
                  isSelected
                    ? {
                        background: `linear-gradient(135deg, ${cat.colorFrom}, ${cat.colorTo})`,
                      }
                    : {}
                }
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Badges & Quick Toggles */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-text-muted pt-1">
        <span>Filter by tag:</span>
        {[
          { label: "Bestsellers", value: "bestseller" },
          { label: "New Arrivals", value: "new" },
          { label: "Premium", value: "premium" },
          { label: "In Stock Only", value: "in_stock", type: "availability" },
        ].map((tag) => {
          const isFilterActive =
            tag.type === "availability"
              ? currentAvailability === tag.value
              : currentFlag === tag.value;

          return (
            <button
              key={tag.value}
              onClick={() => {
                if (tag.type === "availability") {
                  updateQueryParam({
                    availability: isFilterActive ? null : tag.value,
                  });
                } else {
                  updateQueryParam({
                    flag: isFilterActive ? null : tag.value,
                  });
                }
              }}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                isFilterActive
                  ? "bg-accent-magenta/20 border-accent-magenta text-accent-gold font-bold"
                  : "bg-white/[0.03] border-white/10 text-text-muted hover:text-foreground"
              }`}
            >
              {tag.label}
            </button>
          );
        })}

        {/* Clear Filters if any applied */}
        {(currentCategory || currentQuery || currentAvailability || currentFlag) && (
          <button
            onClick={() =>
              updateQueryParam({
                category: null,
                q: null,
                availability: null,
                flag: null,
              })
            }
            className="text-rose-400 hover:underline font-semibold ml-auto text-xs"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Mobile Filters Drawer */}
      {filterDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fadeIn"
          onClick={() => setFilterDrawerOpen(false)}
        >
          <div
            className="w-full max-w-xs bg-bg-1 h-full p-6 flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <h3 className="font-heading font-bold text-lg text-foreground">
                Filter Catalogue
              </h3>
              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="p-1 text-text-muted hover:text-foreground"
                aria-label="Close Filter Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Availability */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-text-muted uppercase mb-3">Availability</h4>
              <div className="space-y-2">
                {["all", "in_stock", "limited"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      updateQueryParam({
                        availability: opt === "all" ? null : opt,
                      });
                    }}
                    className="flex items-center justify-between w-full text-xs py-1.5 text-text-muted hover:text-foreground capitalize"
                  >
                    <span>{opt.replace("_", " ")}</span>
                    {(opt === "all" && !currentAvailability) || currentAvailability === opt ? (
                      <Check className="w-4 h-4 text-accent-gold" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setFilterDrawerOpen(false)}
              className="mt-auto w-full py-2.5 rounded-xl bg-accent-magenta text-white font-bold text-sm"
            >
              Apply & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
