"use client";

import React, { useState } from "react";
import { formatPaise } from "@/lib/utils/money";
import { Button } from "@/components/ui/Button";
import { X, AlertCircle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

interface BulkPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductIds: string[];
  categories: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

export function BulkPriceModal({
  isOpen,
  onClose,
  selectedProductIds,
  categories,
  onSuccess,
}: BulkPriceModalProps) {
  const [scope, setScope] = useState<"SELECTED" | "CATEGORY">(
    selectedProductIds.length > 0 ? "SELECTED" : "CATEGORY"
  );
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || "");
  const [mode, setMode] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [adjustmentValue, setAdjustmentValue] = useState<string>("10"); // +10% or +50 rupees
  const [isIncrease, setIsIncrease] = useState(true);
  const [roundToRupee, setRoundToRupee] = useState(true);

  // Preview state
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState<any[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Apply state
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  if (!isOpen) return null;

  const handlePreview = async () => {
    setErrorMsg(null);
    setPreviewRows(null);
    setIsPreviewLoading(true);

    const numericVal = parseFloat(adjustmentValue);
    if (isNaN(numericVal) || numericVal <= 0) {
      setErrorMsg("Please enter a valid positive adjustment amount.");
      setIsPreviewLoading(false);
      return;
    }

    const multiplier = isIncrease ? 1 : -1;
    // For fixed mode: convert rupees to paise
    const adjustment = mode === "PERCENTAGE" ? numericVal * multiplier : Math.round(numericVal * 100) * multiplier;

    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_PRICE_PREVIEW",
          productIds: scope === "SELECTED" ? selectedProductIds : undefined,
          categoryId: scope === "CATEGORY" ? selectedCategory : undefined,
          mode,
          adjustment,
          roundToNearestRupee: roundToRupee,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setErrorMsg(json.message || "Failed to generate price preview.");
      } else {
        setPreviewRows(json.data.previewRows);
      }
    } catch {
      setErrorMsg("Network error connecting to pricing service.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleApply = async () => {
    if (!previewRows || previewRows.length === 0) return;
    setIsApplying(true);
    setErrorMsg(null);

    const numericVal = parseFloat(adjustmentValue);
    const multiplier = isIncrease ? 1 : -1;
    const adjustment = mode === "PERCENTAGE" ? numericVal * multiplier : Math.round(numericVal * 100) * multiplier;

    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_PRICE_APPLY",
          productIds: scope === "SELECTED" ? selectedProductIds : undefined,
          categoryId: scope === "CATEGORY" ? selectedCategory : undefined,
          mode,
          adjustment,
          roundToNearestRupee: roundToRupee,
          confirm: true,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setErrorMsg(json.message || "Failed to apply bulk price update.");
        setIsApplying(false);
      } else {
        setApplySuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          setApplySuccess(false);
          setPreviewRows(null);
        }, 1200);
      }
    } catch {
      setErrorMsg("Network error applying bulk price update.");
      setIsApplying(false);
    }
  };

  const hasInvalidRows = previewRows?.some((r) => !r.isValid) ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-surface-1 border border-border rounded-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold font-heading text-text">Bulk Price Update</h3>
            <p className="text-xs text-muted">
              Adjust prices across multiple items with live preview and validation guards.
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-muted hover:text-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {applySuccess ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
              <h4 className="text-lg font-bold text-text">Bulk Price Update Applied!</h4>
              <p className="text-xs text-muted">Catalogue prices updated and cached caches refreshed.</p>
            </div>
          ) : (
            <>
              {/* Scope & Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Scope */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">
                    Target Products
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setScope("SELECTED")}
                      disabled={selectedProductIds.length === 0}
                      className={`flex-1 py-2 px-3 text-xs rounded-lg border font-medium ${
                        scope === "SELECTED"
                          ? "bg-accent-gold/20 border-accent-gold text-accent-gold"
                          : "bg-surface-2 border-border text-muted"
                      } ${selectedProductIds.length === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      Selected ({selectedProductIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setScope("CATEGORY")}
                      className={`flex-1 py-2 px-3 text-xs rounded-lg border font-medium ${
                        scope === "CATEGORY"
                          ? "bg-accent-gold/20 border-accent-gold text-accent-gold"
                          : "bg-surface-2 border-border text-muted"
                      }`}
                    >
                      By Category
                    </button>
                  </div>
                </div>

                {/* Category select if category scope */}
                {scope === "CATEGORY" && (
                  <div>
                    <label className="block text-xs font-semibold text-text mb-1.5">
                      Choose Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-gold"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Adjustment Rule */}
              <div className="p-4 rounded-xl bg-surface-2/60 border border-border space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Increase / Decrease */}
                  <div className="flex rounded-lg border border-border overflow-hidden bg-surface-1">
                    <button
                      type="button"
                      onClick={() => setIsIncrease(true)}
                      className={`py-1.5 px-3 text-xs font-bold ${
                        isIncrease ? "bg-green-600 text-white" : "text-muted hover:text-text"
                      }`}
                    >
                      + Increase
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsIncrease(false)}
                      className={`py-1.5 px-3 text-xs font-bold ${
                        !isIncrease ? "bg-red-600 text-white" : "text-muted hover:text-text"
                      }`}
                    >
                      − Decrease
                    </button>
                  </div>

                  {/* Value input */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={adjustmentValue}
                      onChange={(e) => setAdjustmentValue(e.target.value)}
                      className="w-24 px-3 py-1.5 rounded-lg bg-surface-1 border border-border text-sm text-text font-bold"
                    />
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as any)}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-1 border border-border text-xs text-text"
                    >
                      <option value="PERCENTAGE">% Percentage</option>
                      <option value="FIXED">₹ Fixed Rupees</option>
                    </select>
                  </div>

                  {/* Rounding check */}
                  <label className="text-xs text-muted flex items-center gap-1.5 ml-auto cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roundToRupee}
                      onChange={(e) => setRoundToRupee(e.target.checked)}
                      className="rounded accent-accent-gold"
                    />
                    Round to nearest ₹1
                  </label>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  disabled={isPreviewLoading}
                  className="gap-2 text-xs"
                >
                  {isPreviewLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Generate Live Price Preview
                </Button>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Preview Table */}
              {previewRows && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-text">
                      Previewing {previewRows.length} Products
                    </span>
                    {hasInvalidRows ? (
                      <span className="text-red-400 font-bold">
                        ⚠️ Some items would have invalid prices. Fix adjustment to proceed.
                      </span>
                    ) : (
                      <span className="text-green-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> All prices valid
                      </span>
                    )}
                  </div>

                  <div className="border border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-surface-2 sticky top-0 text-muted uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">SKU</th>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3 text-right">Current Rate</th>
                          <th className="py-2 px-3 text-right">New Rate</th>
                          <th className="py-2 px-3 text-right">MRP</th>
                          <th className="py-2 px-3 text-right">New Discount</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {previewRows.map((r) => (
                          <tr
                            key={r.id}
                            className={r.isValid ? "hover:bg-surface-2/40" : "bg-red-500/10 text-red-200"}
                          >
                            <td className="py-2 px-3 font-mono">{r.sku}</td>
                            <td className="py-2 px-3 font-medium truncate max-w-[150px]">{r.name}</td>
                            <td className="py-2 px-3 text-right font-price text-muted">
                              {formatPaise(r.oldPricePaise)}
                            </td>
                            <td className="py-2 px-3 text-right font-price font-bold text-accent-gold">
                              {formatPaise(r.newPricePaise)}
                            </td>
                            <td className="py-2 px-3 text-right font-price text-muted">
                              {formatPaise(r.mrpPaise)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-accent-orange">
                              {r.newDiscountPercent}% off
                            </td>
                            <td className="py-2 px-3">
                              {r.isValid ? (
                                <span className="text-green-400 font-semibold">Valid</span>
                              ) : (
                                <span className="text-red-400 font-bold">{r.error}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!applySuccess && previewRows && (
          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApply}
              disabled={isApplying || hasInvalidRows}
              className="gap-2"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Applying Changes...
                </>
              ) : (
                <>
                  Confirm &amp; Apply New Prices
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
