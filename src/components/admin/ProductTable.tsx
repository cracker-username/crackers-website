"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { formatPaise } from "@/lib/utils/money";
import { Button } from "@/components/ui/Button";
import {
  Search,
  Plus,
  TrendingUp,
  Download,
  Upload,
  Trash2,
  Edit2,
  Copy,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";
import { ProductModal } from "./ProductModal";
import { BulkPriceModal } from "./BulkPriceModal";
import { CsvImportModal } from "./CsvImportModal";

interface ProductTableProps {
  initialCategories: Array<{ id: string; name: string }>;
}

export function ProductTable({ initialCategories }: ProductTableProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState(initialCategories);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isBulkPriceOpen, setIsBulkPriceOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchProducts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
      });
      if (search.trim()) params.set("search", search.trim());
      if (selectedCategory) params.set("categoryId", selectedCategory);
      if (selectedAvailability) params.set("availability", selectedAvailability);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const json = await res.json();

      if (json.ok) {
        setProducts(json.data.products);
        setCategories(json.data.categories);
        setTotalPages(json.data.pagination.totalPages);
        setTotalProducts(json.data.pagination.total);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedCategory, selectedAvailability]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchProducts]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Quick Row Actions
  const handleToggleActive = async (product: any) => {
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: product.version,
          isActive: !product.isActive,
        }),
      });
      fetchProducts();
    } catch {
      alert("Failed to update status.");
    }
  };

  const handleUpdateAvailability = async (product: any, newStatus: string) => {
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: product.version,
          availability: newStatus,
        }),
      });
      fetchProducts();
    } catch {
      alert("Failed to update availability.");
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this product?")) return;
    try {
      await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      fetchProducts();
    } catch {
      alert("Failed to archive product.");
    }
  };

  const handleDuplicate = (prod: any) => {
    setEditingProduct({
      ...prod,
      id: undefined,
      sku: `${prod.sku}-COPY-${Math.floor(Math.random() * 900 + 100)}`,
      name: `${prod.name} (Copy)`,
      version: 1,
    });
    setIsProductModalOpen(true);
  };

  // Bulk actions
  const handleBulkArchive = async () => {
    if (!confirm(`Are you sure you want to archive ${selectedIds.length} selected products?`)) return;
    try {
      await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_ARCHIVE",
          productIds: selectedIds,
        }),
      });
      setSelectedIds([]);
      fetchProducts();
    } catch {
      alert("Bulk archive failed.");
    }
  };

  const handleBulkAvailability = async (availability: string) => {
    try {
      await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_AVAILABILITY",
          productIds: selectedIds,
          availability,
        }),
      });
      fetchProducts();
    } catch {
      alert("Bulk update failed.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-text">Catalogue Products</h2>
          <p className="text-xs text-muted mt-0.5">
            {totalProducts} products listed across {categories.length} categories
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCsvImportOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </Button>

          <a href="/api/admin/products/export-csv" download>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBulkPriceOpen(true)}
            className="gap-1.5 text-xs text-accent-gold border-accent-gold/40 hover:bg-accent-gold/10"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Bulk Price Update
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            className="gap-1.5 text-xs shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-surface-1 border border-border flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-gold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-gold"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Availability Filter */}
          <select
            value={selectedAvailability}
            onChange={(e) => {
              setSelectedAvailability(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-gold"
          >
            <option value="">All Stock Status</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LIMITED">Limited Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Bulk Operations Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-xl bg-accent-gold/15 border border-accent-gold/40 flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold text-accent-gold">{selectedIds.length} items selected</span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-muted hover:text-text underline text-[11px] ml-2"
            >
              Deselect All
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAvailability("IN_STOCK")}
              className="text-xs py-1"
            >
              Set In Stock
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAvailability("OUT_OF_STOCK")}
              className="text-xs py-1 text-red-300"
            >
              Set Out of Stock
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkPriceOpen(true)}
              className="text-xs py-1 text-accent-gold"
            >
              Bulk Price
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkArchive}
              className="text-xs py-1 text-red-400 hover:bg-red-500/20"
            >
              Archive
            </Button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-surface-1 border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-2 text-muted uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-3 w-8 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-muted hover:text-text cursor-pointer"
                  >
                    {selectedIds.length === products.length && products.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-accent-gold" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Item Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Pack &amp; Unit</th>
                <th className="py-3 px-3 text-right">MRP (₹)</th>
                <th className="py-3 px-3 text-right">Rate (₹)</th>
                <th className="py-3 px-3 text-center">Availability</th>
                <th className="py-3 px-3 text-center">Active</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-accent-gold" />
                    Loading catalogue products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const isSelected = selectedIds.includes(prod.id);
                  const imageSrc = prod.images?.[0]?.url || "/placeholders/sparkler.svg";

                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-surface-2/40 transition-colors ${
                        isSelected ? "bg-accent-gold/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(prod.id)}
                          className="text-muted hover:text-text cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-accent-gold" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Item Description */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface-2 shrink-0 border border-border">
                            <Image
                              src={imageSrc}
                              alt={prod.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-semibold text-text block truncate max-w-[200px]">
                              {prod.name}
                            </span>
                            <span className="font-mono text-[10px] text-muted">
                              SKU: {prod.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-muted">
                        <span className="px-2 py-0.5 rounded-full bg-surface-2 text-[10px] font-medium border border-border">
                          {prod.category?.name || "Uncategorized"}
                        </span>
                      </td>

                      {/* Pack Size */}
                      <td className="py-3 px-3 text-muted">
                        {prod.packSize}
                      </td>

                      {/* MRP */}
                      <td className="py-3 px-3 text-right font-price text-muted">
                        {formatPaise(prod.mrpPaise)}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right font-price font-bold text-accent-gold">
                        {formatPaise(prod.pricePaise)}
                      </td>

                      {/* Availability Quick Toggle */}
                      <td className="py-3 px-3 text-center">
                        <select
                          value={prod.availability}
                          onChange={(e) => handleUpdateAvailability(prod, e.target.value)}
                          className={`text-[10px] font-bold rounded-full px-2 py-1 border cursor-pointer ${
                            prod.availability === "IN_STOCK"
                              ? "bg-green-500/10 text-green-300 border-green-500/30"
                              : prod.availability === "LIMITED"
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                              : "bg-red-500/10 text-red-300 border-red-500/30"
                          }`}
                        >
                          <option value="IN_STOCK">In Stock</option>
                          <option value="LIMITED">Limited</option>
                          <option value="OUT_OF_STOCK">Out of Stock</option>
                          <option value="UNAVAILABLE">Unavailable</option>
                        </select>
                      </td>

                      {/* Active Status Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(prod)}
                          className={`w-7 h-4 rounded-full transition-colors relative inline-flex items-center cursor-pointer ${
                            prod.isActive ? "bg-green-500" : "bg-surface-2 border border-border"
                          }`}
                          title={prod.isActive ? "Active (Click to hide)" : "Hidden (Click to show)"}
                        >
                          <span
                            className={`w-3 h-3 rounded-full bg-white transition-transform ${
                              prod.isActive ? "translate-x-3.5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(prod);
                              setIsProductModalOpen(true);
                            }}
                            className="p-1 text-muted hover:text-accent-gold rounded transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(prod)}
                            className="p-1 text-muted hover:text-text rounded transition-colors"
                            title="Duplicate Product"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchive(prod.id)}
                            className="p-1 text-muted hover:text-red-400 rounded transition-colors"
                            title="Archive Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted">
            <span>
              Showing page {page} of {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="py-1 px-2.5 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="py-1 px-2.5 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={editingProduct}
        categories={categories}
        onSuccess={fetchProducts}
      />

      <BulkPriceModal
        isOpen={isBulkPriceOpen}
        onClose={() => setIsBulkPriceOpen(false)}
        selectedProductIds={selectedIds}
        categories={categories}
        onSuccess={() => {
          setSelectedIds([]);
          fetchProducts();
        }}
      />

      <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        onSuccess={fetchProducts}
      />
    </div>
  );
}
