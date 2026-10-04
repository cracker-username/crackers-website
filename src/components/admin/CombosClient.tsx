"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Package,
  TrendingDown,
  Percent,
} from "lucide-react";
import { paiseToRupees, formatPaise } from "@/lib/utils/money";

interface ComboProduct {
  id: string;
  name: string;
  sku: string;
  pricePaise: number;
  availability: string;
  isArchived: boolean;
}

interface ComboItem {
  id: string;
  productId: string;
  quantity: number;
  product: ComboProduct;
}

interface ComboRecord {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  originalPaise: number;
  comboPaise: number;
  availability: "IN_STOCK" | "LIMITED" | "OUT_OF_STOCK" | "UNAVAILABLE";
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  items: ComboItem[];
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  pricePaise: number;
}

interface CombosClientProps {
  initialCombos: ComboRecord[];
  availableProducts: ProductOption[];
}

export function CombosClient({ initialCombos, availableProducts }: CombosClientProps) {
  const [combos, setCombos] = useState<ComboRecord[]>(initialCombos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboRecord | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [comboRupees, setComboRupees] = useState("");
  const [availability, setAvailability] = useState<"IN_STOCK" | "LIMITED" | "OUT_OF_STOCK" | "UNAVAILABLE">("IN_STOCK");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  // Items in the combo being edited: { productId, quantity }
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [selectedAddProductId, setSelectedAddProductId] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Fetch updated combos from API
  const fetchCombos = async () => {
    try {
      const res = await fetch("/api/admin/combos");
      const json = await res.json();
      if (json.ok) setCombos(json.data);
    } catch {
      // ignore
    }
  };

  const openCreateModal = () => {
    setEditingCombo(null);
    setName("");
    setDescription("");
    setImage("");
    setComboRupees("");
    setAvailability("IN_STOCK");
    setIsFeatured(false);
    setIsActive(true);
    setSortOrder(0);
    setSelectedItems([]);
    setSelectedAddProductId(availableProducts[0]?.id || "");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: ComboRecord) => {
    setEditingCombo(c);
    setName(c.name);
    setDescription(c.description || "");
    setImage(c.image || "");
    setComboRupees(paiseToRupees(c.comboPaise).toString());
    setAvailability(c.availability);
    setIsFeatured(c.isFeatured);
    setIsActive(c.isActive);
    setSortOrder(c.sortOrder);
    setSelectedItems(
      c.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
      }))
    );
    setSelectedAddProductId(availableProducts[0]?.id || "");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    if (!selectedAddProductId) return;
    const existing = selectedItems.find((i) => i.productId === selectedAddProductId);
    if (existing) {
      setSelectedItems(
        selectedItems.map((i) =>
          i.productId === selectedAddProductId ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setSelectedItems([...selectedItems, { productId: selectedAddProductId, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (productId: string) => {
    setSelectedItems(selectedItems.filter((i) => i.productId !== productId));
  };

  const handleUpdateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setSelectedItems(
      selectedItems.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
    );
  };

  // Compute aggregate original price in paise
  const aggregateOriginalPaise = selectedItems.reduce((acc, it) => {
    const prod = availableProducts.find((p) => p.id === it.productId);
    return acc + (prod ? prod.pricePaise * it.quantity : 0);
  }, 0);

  const parsedComboPaise = Math.round((parseFloat(comboRupees) || 0) * 100);
  const savingsPaise = Math.max(0, aggregateOriginalPaise - parsedComboPaise);
  const discountPercent =
    aggregateOriginalPaise > 0
      ? Math.round((savingsPaise / aggregateOriginalPaise) * 100)
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setErrorMsg("Please add at least one product to this combo package.");
      return;
    }

    if (parsedComboPaise <= 0) {
      setErrorMsg("Combo price must be greater than zero.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const payload = {
      name,
      description: description || undefined,
      image: image || undefined,
      comboPaise: parsedComboPaise,
      availability,
      isFeatured,
      isActive,
      sortOrder,
      items: selectedItems,
    };

    try {
      const url = editingCombo ? `/api/admin/combos/${editingCombo.id}` : "/api/admin/combos";
      const method = editingCombo ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Failed to save combo package.");
      }

      setFeedback(`Combo "${name}" ${editingCombo ? "updated" : "created"} successfully!`);
      setTimeout(() => setFeedback(null), 3000);
      setIsModalOpen(false);
      await fetchCombos();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, comboName: string) => {
    if (!confirm(`Are you sure you want to archive combo "${comboName}"?`)) return;

    try {
      const res = await fetch(`/api/admin/combos/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        alert(json.message || "Failed to archive combo");
        return;
      }
      setFeedback(`Combo "${comboName}" archived successfully.`);
      setTimeout(() => setFeedback(null), 3000);
      await fetchCombos();
    } catch {
      alert("Network error archiving combo.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-gold" />
            Combos & Gift Boxes
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Create high-value festival packages, manage contents, and track bundle savings.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Combo
        </Button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {feedback}
        </div>
      )}

      {/* Grid of combos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {combos.map((combo) => {
          const savings = Math.max(0, combo.originalPaise - combo.comboPaise);
          const discPercent =
            combo.originalPaise > 0
              ? Math.round((savings / combo.originalPaise) * 100)
              : 0;

          return (
            <div
              key={combo.id}
              className="bg-brand-bg-1/80 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-brand-gold/40 transition-all shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-snug">{combo.name}</h3>
                    <span className="text-xs text-brand-muted">/{combo.slug}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {combo.isFeatured && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Featured
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        combo.availability === "IN_STOCK"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : combo.availability === "LIMITED"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      {combo.availability.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {combo.description && (
                  <p className="text-xs text-brand-muted/80 line-clamp-2 mb-4">
                    {combo.description}
                  </p>
                )}

                {/* Items Box */}
                <div className="bg-brand-bg-0/60 rounded-xl p-3 border border-white/5 mb-4">
                  <div className="text-xs font-semibold text-brand-muted flex items-center gap-1 mb-2">
                    <Package className="w-3.5 h-3.5 text-brand-accent-cyan" />
                    Included Products ({combo.items.length})
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                    {combo.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-white/90 py-0.5 border-b border-white/5 last:border-0"
                      >
                        <span className="truncate max-w-[180px]">{item.product.name}</span>
                        <span className="text-brand-muted font-mono font-medium">
                          × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing info */}
                <div className="flex items-baseline justify-between mb-4 pt-2 border-t border-white/5">
                  <div>
                    <div className="text-xs text-brand-muted line-through">
                      Worth {formatPaise(combo.originalPaise)}
                    </div>
                    <div className="text-xl font-black text-brand-gold">
                      {formatPaise(combo.comboPaise)}
                    </div>
                  </div>
                  {discPercent > 0 && (
                    <div className="text-right">
                      <span className="px-2 py-1 rounded-lg text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        {discPercent}% OFF
                      </span>
                      <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                        Save {formatPaise(savings)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(combo)}
                  className="border-white/10 hover:border-white/30 text-xs flex items-center gap-1.5 h-8 px-3"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(combo.id, combo.name)}
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 text-xs flex items-center gap-1.5 h-8 px-3"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Archive
                </Button>
              </div>
            </div>
          );
        })}

        {combos.length === 0 && (
          <div className="col-span-full py-16 text-center text-brand-muted bg-brand-bg-1/40 border border-white/10 rounded-2xl">
            <Layers className="w-12 h-12 mx-auto text-brand-muted/40 mb-3" />
            <p className="text-base font-semibold">No combo packages created yet.</p>
            <p className="text-xs mt-1">
              Click &quot;Create New Combo&quot; to bundle individual crackers into festive gift boxes.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-brand-bg-1 border border-white/20 rounded-2xl w-full max-w-2xl my-8 p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-brand-muted hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-brand-primary" />
              {editingCombo ? "Edit Combo Package" : "Create New Combo Package"}
            </h2>
            <p className="text-xs text-brand-muted mb-6">
              Bundle products together with an aggregate calculated value and custom package price.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                    Combo Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mega Family Sparkler Box"
                    className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                    Availability
                  </label>
                  <select
                    value={availability}
                    onChange={(e) =>
                      setAvailability(
                        e.target.value as "IN_STOCK" | "LIMITED" | "OUT_OF_STOCK" | "UNAVAILABLE"
                      )
                    }
                    className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="IN_STOCK">In Stock</option>
                    <option value="LIMITED">Limited Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of what is inside the combo..."
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary resize-none"
                />
              </div>

              {/* Items Picker Section */}
              <div className="bg-brand-bg-0/60 rounded-xl p-4 border border-white/10 space-y-3">
                <label className="block text-xs font-bold text-white uppercase flex items-center justify-between">
                  <span>Combo Contents ({selectedItems.length} items)</span>
                  <span className="text-[11px] text-brand-muted font-normal">
                    Calculated Value: {formatPaise(aggregateOriginalPaise)}
                  </span>
                </label>

                {/* Add product dropdown */}
                <div className="flex gap-2">
                  <select
                    value={selectedAddProductId}
                    onChange={(e) => setSelectedAddProductId(e.target.value)}
                    className="flex-1 bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary truncate"
                  >
                    {availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — {formatPaise(p.pricePaise)}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-white text-xs h-9"
                  >
                    Add Product
                  </Button>
                </div>

                {/* Selected Products List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedItems.map((item) => {
                    const prod = availableProducts.find((p) => p.id === item.productId);
                    if (!prod) return null;

                    return (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between bg-brand-bg-1/80 border border-white/5 rounded-lg px-3 py-2 text-xs text-white"
                      >
                        <div className="truncate max-w-[220px]">
                          <span className="font-medium">{prod.name}</span>
                          <span className="text-[10px] text-brand-muted ml-2">
                            ({formatPaise(prod.pricePaise)} each)
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-brand-muted text-[10px]">Qty:</span>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)
                              }
                              className="w-14 bg-brand-bg-0 border border-white/10 rounded px-1.5 py-0.5 text-center text-xs text-white font-mono"
                            />
                          </div>
                          <span className="font-mono text-brand-gold min-w-[70px] text-right">
                            {formatPaise(prod.pricePaise * item.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productId)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {selectedItems.length === 0 && (
                    <div className="text-center py-4 text-xs text-brand-muted">
                      No products added yet. Select a product above and click &quot;Add Product&quot;.
                    </div>
                  )}
                </div>
              </div>

              {/* Price & Savings Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                    Special Combo Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={comboRupees}
                    onChange={(e) => setComboRupees(e.target.value)}
                    placeholder="e.g. 1999"
                    className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-sm text-brand-gold font-bold focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div className="bg-brand-bg-0/60 rounded-xl p-3 border border-white/10 flex flex-col justify-center">
                  <div className="flex items-center justify-between text-xs text-brand-muted">
                    <span>Original Aggregate:</span>
                    <span className="font-mono line-through">
                      {formatPaise(aggregateOriginalPaise)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3 h-3" /> Customer Savings:
                    </span>
                    <span>
                      {discountPercent}% ({formatPaise(savingsPaise)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-brand-bg-0 text-brand-primary"
                  />
                  <span>Feature on Homepage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-brand-bg-0 text-brand-primary"
                  />
                  <span>Active for Enquiry</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingCombo ? (
                    "Save Changes"
                  ) : (
                    "Create Combo"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
