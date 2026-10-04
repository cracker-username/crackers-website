"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  Package,
} from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  colorFrom: string;
  colorTo: string;
  image?: string | null;
  sortOrder: number;
  _count?: { products: number };
}

interface CategoriesClientProps {
  initialCategories: CategoryItem[];
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [colorFrom, setColorFrom] = useState("#FF2E93");
  const [colorTo, setColorTo] = useState("#FF7A18");
  const [sortOrder, setSortOrder] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      if (json.ok) setCategories(json.data);
    } catch {
      // ignore
    }
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setColorFrom("#FF2E93");
    setColorTo("#FF7A18");
    setSortOrder(categories.length);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setColorFrom(cat.colorFrom || "#FF2E93");
    setColorTo(cat.colorTo || "#FF7A18");
    setSortOrder(cat.sortOrder || 0);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Category name is required.");
      return;
    }

    setIsLoading(true);

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      colorFrom,
      colorTo,
      sortOrder,
    };

    try {
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setErrorMsg(json.message || "Failed to save category.");
        setIsLoading(false);
        return;
      }

      await fetchCategories();
      setIsModalOpen(false);
    } catch {
      setErrorMsg("Network error saving category.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async (cat: CategoryItem) => {
    if (!confirm(`Are you sure you want to archive category "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        alert(json.message || "Cannot archive category.");
        return;
      }

      await fetchCategories();
    } catch {
      alert("Failed to archive category.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-text">Categories Management</h2>
          <p className="text-xs text-muted mt-0.5">
            Configure fireworks category classifications and signature gradient themes.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          className="gap-1.5 text-xs shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const productCount = cat._count?.products || 0;

          return (
            <div
              key={cat.id}
              className="p-5 rounded-2xl bg-surface-1 border border-border shadow-sm flex flex-col justify-between space-y-4 hover:border-border/80 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  {/* Gradient Swatch Pill */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full shadow-inner border border-white/20"
                      style={{
                        background: `linear-gradient(135deg, ${cat.colorFrom}, ${cat.colorTo})`,
                      }}
                    />
                    <span className="font-heading font-bold text-sm text-text truncate">
                      {cat.name}
                    </span>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 text-muted border border-border flex items-center gap-1 font-semibold">
                    <Package className="w-3 h-3 text-accent-gold" />
                    {productCount} items
                  </span>
                </div>

                <p className="text-xs text-muted line-clamp-2">
                  {cat.description || "No description configured."}
                </p>

                <p className="text-[10px] font-mono text-muted/80 mt-2">
                  slug: /{cat.slug}
                </p>
              </div>

              {/* Bottom Actions & Color Hexes */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono text-muted">
                  {cat.colorFrom} → {cat.colorTo}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 text-muted hover:text-accent-gold rounded transition-colors"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchive(cat)}
                    className="p-1.5 text-muted hover:text-red-400 rounded transition-colors"
                    title="Archive Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-1 border border-border rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base font-heading text-text">
                {editingCategory ? `Edit: ${editingCategory.name}` : "Create Category"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-text p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aerial Fancy Night Sky"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Spectacular multishot sky shells with golden brocades..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-gold resize-none"
                />
              </div>

              {/* Gradient Theme Swatches */}
              <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-2">
                <span className="text-[11px] font-bold text-text block">
                  Category Gradient Theme (colorFrom &amp; colorTo)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-muted mb-1">Start Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorFrom}
                        onChange={(e) => setColorFrom(e.target.value)}
                        className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={colorFrom}
                        onChange={(e) => setColorFrom(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-surface-1 border border-border text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-muted mb-1">End Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorTo}
                        onChange={(e) => setColorTo(e.target.value)}
                        className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={colorTo}
                        onChange={(e) => setColorTo(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-surface-1 border border-border text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Gradient Preview Swatch */}
                <div
                  className="w-full h-8 rounded-lg shadow-inner flex items-center justify-center text-xs font-bold text-white shadow-sm mt-2"
                  style={{
                    background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
                  }}
                >
                  Live Theme Swatch
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Display Sort Order
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-gold"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    "Save Category"
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
