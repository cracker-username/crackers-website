"use client";

import React, { useState } from "react";
import { formatPaise } from "@/lib/utils/money";
import { Button } from "@/components/ui/Button";
import {
  X,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CsvImportModal({ isOpen, onClose, onSuccess }: CsvImportModalProps) {
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
    };
    reader.readAsText(file);
  };

  const handlePreview = async () => {
    if (!csvText.trim()) {
      setErrorMsg("Please upload a CSV file or paste CSV content.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setPreviewData(null);

    try {
      const res = await fetch("/api/admin/products/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent: csvText,
          previewOnly: true,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setErrorMsg(json.message || "Failed to parse CSV.");
      } else {
        setPreviewData(json.data);
      }
    } catch {
      setErrorMsg("Network error connecting to CSV parser.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/products/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent: csvText,
          confirm: true,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setErrorMsg(json.message || "Import failed.");
        setIsImporting(false);
      } else {
        setImportSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          setImportSuccess(false);
          setPreviewData(null);
          setCsvText("");
        }, 1500);
      }
    } catch {
      setErrorMsg("Network error during bulk import.");
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-surface-1 border border-border rounded-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold font-heading text-text flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-accent-gold" />
              CSV Product Import
            </h3>
            <p className="text-xs text-muted">
              Bulk update or upload new products using standard CSV format.
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-muted hover:text-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {importSuccess ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
              <h4 className="text-lg font-bold text-text">CSV Import Completed!</h4>
              <p className="text-xs text-muted">Products have been updated and synced to the database.</p>
            </div>
          ) : (
            <>
              {/* Template Download Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border text-xs">
                <div>
                  <span className="font-semibold text-text">Need the standard CSV layout?</span>
                  <p className="text-[11px] text-muted">Includes headers and sample Diwali fireworks rows.</p>
                </div>
                <a href="/api/admin/products/csv-template" download>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    Download Template
                  </Button>
                </a>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1.5">
                  Select CSV File or Paste Raw CSV Data
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2 hover:bg-surface-1 border border-border text-xs font-medium text-text cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-accent-gold" />
                    {fileName ? fileName : "Choose .csv File"}
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {fileName && (
                    <button
                      type="button"
                      onClick={() => {
                        setFileName(null);
                        setCsvText("");
                      }}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Clear File
                    </button>
                  )}
                </div>

                <textarea
                  rows={4}
                  placeholder="sku,name,categoryName,packSize,unit,mrpRupees,priceRupees,availability,isFeatured,isBestseller,shortDesc..."
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border font-mono text-xs text-text focus:outline-none focus:border-accent-gold resize-none"
                />
              </div>

              {/* Validate Action */}
              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handlePreview}
                  disabled={isLoading || !csvText.trim()}
                  className="gap-2 text-xs"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Validate &amp; Preview Rows
                </Button>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Validation Preview */}
              {previewData && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs">
                      <span className="font-bold text-base block">{previewData.validCount}</span>
                      Valid Rows Ready for Import
                    </div>
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                      <span className="font-bold text-base block">{previewData.errorCount}</span>
                      Validation Errors Found
                    </div>
                  </div>

                  {/* List of row errors if any */}
                  {previewData.errors && previewData.errors.length > 0 && (
                    <div className="p-4 rounded-xl bg-surface-2 border border-red-500/40 space-y-2">
                      <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        Row-Level Validation Errors (Fix before import)
                      </h4>
                      <ul className="text-xs space-y-1 list-disc list-inside text-red-300/90 max-h-40 overflow-y-auto">
                        {previewData.errors.map((err: any, idx: number) => (
                          <li key={idx}>
                            <strong>Row {err.rowNumber}</strong> ({err.sku || "No SKU"}): {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sample Valid Rows */}
                  {previewData.sampleRows && previewData.sampleRows.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-text">Sample Valid Rows Preview:</span>
                      <div className="border border-border rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-surface-2 text-muted uppercase text-[10px]">
                            <tr>
                              <th className="py-2 px-3">SKU</th>
                              <th className="py-2 px-3">Name</th>
                              <th className="py-2 px-3">Category</th>
                              <th className="py-2 px-3 text-right">MRP</th>
                              <th className="py-2 px-3 text-right">Enquiry Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {previewData.sampleRows.map((r: any, idx: number) => (
                              <tr key={idx}>
                                <td className="py-1.5 px-3 font-mono">{r.sku}</td>
                                <td className="py-1.5 px-3 font-medium">{r.name}</td>
                                <td className="py-1.5 px-3 text-muted">{r.categoryName}</td>
                                <td className="py-1.5 px-3 text-right font-price text-muted">
                                  {formatPaise(r.mrpPaise)}
                                </td>
                                <td className="py-1.5 px-3 text-right font-price font-bold text-accent-gold">
                                  {formatPaise(r.pricePaise)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!importSuccess && previewData && (
          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmImport}
              disabled={isImporting || previewData.errorCount > 0}
              className="gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing Products...
                </>
              ) : (
                `Confirm & Import ${previewData.validCount} Products`
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
