"use client";

import React, { useState, useEffect } from "react";
import { rupeesToPaise, calculateDiscountPercent } from "@/lib/utils/money";
import { Button } from "@/components/ui/Button";
import { X, AlertCircle, Loader2 } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any | null; // null for Create, product object for Edit
  categories: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

export function ProductModal({
  isOpen,
  onClose,
  product,
  categories,
  onSuccess,
}: ProductModalProps) {
  const isEdit = !!product;

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("Sivakasi Sparklers");
  const [packSize, setPackSize] = useState("1 Box");
  const [unit, setUnit] = useState("Box");
  const [mrpRupees, setMrpRupees] = useState("");
  const [priceRupees, setPriceRupees] = useState("");
  const [availability, setAvailability] = useState<string>("IN_STOCK");
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [lowStockAlert, setLowStockAlert] = useState<string>("10");
  const [shortDesc, setShortDesc] = useState("");
  const [imageUrl, setImageUrl] = useState("/placeholders/sparkler.svg");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form state
  useEffect(() => {
    if (product) {
      setSku(product.sku || "");
      setName(product.name || "");
      setCategoryId(product.categoryId || categories[0]?.id || "");
      setBrand(product.brand || "Sivakasi Sparklers");
      setPackSize(product.packSize || "1 Box");
      setUnit(product.unit || "Box");
      setMrpRupees((product.mrpPaise / 100).toString());
      setPriceRupees((product.pricePaise / 100).toString());
      setAvailability(product.availability || "IN_STOCK");
      setStockQuantity(product.stockQuantity !== null && product.stockQuantity !== undefined ? String(product.stockQuantity) : "");
      setLowStockAlert(product.lowStockAlert ? String(product.lowStockAlert) : "10");
      setShortDesc(product.shortDesc || "");
      setImageUrl(product.images?.[0]?.url || "/placeholders/sparkler.svg");
      setIsFeatured(!!product.isFeatured);
      setIsBestseller(!!product.isBestseller);
      setIsNewArrival(!!product.isNewArrival);
      setIsPremium(!!product.isPremium);
      setIsActive(product.isActive !== false);
    } else {
      setSku(`SPK-${Date.now().toString().slice(-4)}`);
      setName("");
      setCategoryId(categories[0]?.id || "");
      setBrand("Sivakasi Sparklers");
      setPackSize("1 Box");
      setUnit("Box");
      setMrpRupees("200");
      setPriceRupees("120");
      setAvailability("IN_STOCK");
      setStockQuantity("50");
      setLowStockAlert("10");
      setShortDesc("");
      setImageUrl("/placeholders/sparkler.svg");
      setIsFeatured(false);
      setIsBestseller(false);
      setIsNewArrival(false);
      setIsPremium(false);
      setIsActive(true);
    }
    setErrorMsg(null);
  }, [product, categories, isOpen]);

  if (!isOpen) return null;

  const currentMrpPaise = rupeesToPaise(parseFloat(mrpRupees) || 0);
  const currentPricePaise = rupeesToPaise(parseFloat(priceRupees) || 0);
  const discountPercent = calculateDiscountPercent(currentMrpPaise, currentPricePaise);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!sku.trim() || !name.trim() || !categoryId) {
      setErrorMsg("Please fill in SKU, Name, and Category.");
      return;
    }

    if (currentPricePaise <= 0) {
      setErrorMsg("Price must be greater than zero.");
      return;
    }

    if (currentPricePaise > currentMrpPaise && currentMrpPaise > 0) {
      setErrorMsg("Enquiry price cannot exceed MRP.");
      return;
    }

    setIsLoading(true);

    const payload: any = {
      sku: sku.trim(),
      name: name.trim(),
      categoryId,
      brand: brand.trim(),
      packSize: packSize.trim(),
      unit: unit.trim(),
      mrpPaise: currentMrpPaise,
      pricePaise: currentPricePaise,
      availability,
      stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : null,
      lowStockAlert: lowStockAlert ? parseInt(lowStockAlert, 10) : 10,
      shortDesc: shortDesc.trim() || null,
      imageUrl: imageUrl.trim() || undefined,
      isFeatured,
      isBestseller,
      isNewArrival,
      isPremium,
      isActive,
    };

    if (isEdit) {
      payload.version = product.version;
    }

    try {
      const url = isEdit ? `/api/admin/products/${product.id}` : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        if (json.code === "VERSION_CONFLICT") {
          setErrorMsg("⚠️ Version Conflict: This product was modified by another administrator. Please reload to review.");
        } else {
          setErrorMsg(json.message || "Failed to save product.");
        }
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setErrorMsg("Network error saving product.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-surface-1 border border-border rounded-2xl p-6 shadow-2xl max-h-[92vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold font-heading text-text">
              {isEdit ? `Edit Product: ${product.name}` : "Create New Fireworks Product"}
            </h3>
            <p className="text-xs text-muted">
              {isEdit ? `Version ${product.version} (optimistic locking enforced)` : "Add a new catalogue item with live rates"}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-muted hover:text-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <label className="block text-xs font-semibold text-text mb-1">SKU Code *</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text font-mono uppercase focus:outline-none focus:border-accent-gold"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-gold"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">Product Name *</label>
            <input
              type="text"
              placeholder="e.g. 10cm Electric Sparklers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text focus:outline-none focus:border-accent-gold"
              required
            />
          </div>

          {/* Pack & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Pack Size *</label>
              <input
                type="text"
                placeholder="e.g. 10 Pcs / 1 Box"
                value={packSize}
                onChange={(e) => setPackSize(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-gold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Unit Description</label>
              <input
                type="text"
                placeholder="e.g. Box, Pack"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-gold"
                required
              />
            </div>
          </div>

          {/* Pricing & Discount */}
          <div className="p-4 rounded-xl bg-surface-2/60 border border-border space-y-3">
            <span className="text-xs font-bold text-accent-gold uppercase tracking-wider block">
              Pricing &amp; Rates (in ₹ Rupees)
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-text mb-1">MRP (₹) *</label>
                <input
                  type="number"
                  step="any"
                  value={mrpRupees}
                  onChange={(e) => setMrpRupees(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border text-xs font-bold text-text focus:outline-none focus:border-accent-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text mb-1">Enquiry Rate (₹) *</label>
                <input
                  type="number"
                  step="any"
                  value={priceRupees}
                  onChange={(e) => setPriceRupees(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border text-xs font-bold text-accent-gold focus:outline-none focus:border-accent-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text mb-1">Live Discount</label>
                <div className="h-9 px-3 rounded-lg bg-surface-1 border border-border flex items-center font-bold text-xs text-accent-orange">
                  {discountPercent}% OFF
                </div>
              </div>
            </div>
          </div>

          {/* Availability & Stock */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-gold"
              >
                <option value="IN_STOCK">In Stock</option>
                <option value="LIMITED">Limited Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">Stock Qty (Optional)</label>
              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">Low Alert Threshold</label>
              <input
                type="number"
                value={lowStockAlert}
                onChange={(e) => setLowStockAlert(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-gold"
              />
            </div>
          </div>

          {/* Image & Short Description */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">Image URL / SVG Path</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-gold font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">Short Description</label>
            <input
              type="text"
              placeholder="e.g. Crisp crackling golden sparkles with long burn time."
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-gold"
            />
          </div>

          {/* Flags Strip */}
          <div className="pt-2 border-t border-border flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded accent-accent-gold"
              />
              <span>Featured</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isBestseller}
                onChange={(e) => setIsBestseller(e.target.checked)}
                className="rounded accent-accent-gold"
              />
              <span>Bestseller</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isNewArrival}
                onChange={(e) => setIsNewArrival(e.target.checked)}
                className="rounded accent-accent-gold"
              />
              <span>New Arrival</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="rounded accent-accent-gold"
              />
              <span>Premium</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded accent-accent-gold"
              />
              <span className="font-semibold text-green-400">Active in Catalogue</span>
            </label>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Product"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
