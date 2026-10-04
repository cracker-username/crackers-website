"use client";

import React, { useState, useEffect } from "react";
import { formatPaise, paiseToRupees, rupeesToPaise } from "@/lib/utils/money";
import { formatToKolkataTime } from "@/lib/utils/dates";
import { Button } from "@/components/ui/Button";
import {
  X,
  Phone,
  MessageCircle,
  Truck,
  FileText,
  UserCheck,
  History,
  Edit3,
  Send,
  Printer,
  MapPin,
  Clock,
  AlertTriangle,
  Layers,
  ShieldAlert,
} from "lucide-react";
import { EnquiryStatus } from "@prisma/client";

interface StaffOption {
  id: string;
  name: string;
  email: string;
}

interface EnquiryDetailDrawerProps {
  enquiryId: string | null;
  onClose: () => void;
  staffList: StaffOption[];
  onUpdated: () => void;
}

const STATUS_COLORS: Record<EnquiryStatus, { bg: string; text: string; border: string }> = {
  NEW: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  CONTACTED: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/30" },
  QUOTE_SENT: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  AWAITING_CUSTOMER: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  CONFIRMED: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  READY: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/30" },
  DISPATCHED: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  COMPLETED: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
  CANCELLED: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
};

export function EnquiryDetailDrawer({
  enquiryId,
  onClose,
  staffList,
  onUpdated,
}: EnquiryDetailDrawerProps) {
  const [enquiry, setEnquiry] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"items" | "timeline" | "notes" | "revisions">("items");

  // Status transition form
  const [nextStatus, setNextStatus] = useState<EnquiryStatus | "">("");
  const [statusComment, setStatusComment] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [statusVisibleToCustomer, setStatusVisibleToCustomer] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Dispatch form
  const [transportName, setTransportName] = useState("");
  const [lrNumber, setLrNumber] = useState("");
  const [isUpdatingDispatch, setIsUpdatingDispatch] = useState(false);

  // Assignment form
  const [assignedToId, setAssignedToId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // New Note form
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Revision Modal form
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisedItems, setRevisedItems] = useState<any[]>([]);
  const [revisedExtraDiscount, setRevisedExtraDiscount] = useState("0");
  const [revisedShipping, setRevisedShipping] = useState("0");
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDetail = React.useCallback(async () => {
    if (!enquiryId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}`);
      const json = await res.json();
      if (json.ok) {
        setEnquiry(json.data);
        setTransportName(json.data.transportName || "");
        setLrNumber(json.data.lrNumber || "");
        setAssignedToId(json.data.assignedToId || "");
      } else {
        setErrorMsg(json.message || "Failed to load enquiry details.");
      }
    } catch {
      setErrorMsg("Network error loading enquiry details.");
    } finally {
      setIsLoading(false);
    }
  }, [enquiryId]);

  useEffect(() => {
    if (enquiryId) {
      fetchDetail();
    }
  }, [enquiryId, fetchDetail]);

  if (!enquiryId) return null;

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextStatus) return;

    setIsUpdatingStatus(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetStatus: nextStatus,
          comment: statusComment || undefined,
          reopenReason: reopenReason || undefined,
          visibleToCustomer: statusVisibleToCustomer,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Failed to update status.");
      }

      setFeedback(`Status updated to ${nextStatus}`);
      setTimeout(() => setFeedback(null), 3000);
      setNextStatus("");
      setStatusComment("");
      setReopenReason("");
      await fetchDetail();
      onUpdated();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error updating status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignChange = async (newAssigneeId: string) => {
    setIsAssigning(true);
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: newAssigneeId || null }),
      });
      const json = await res.json();
      if (json.ok) {
        setAssignedToId(newAssigneeId);
        setFeedback("Assigned staff updated.");
        setTimeout(() => setFeedback(null), 3000);
        await fetchDetail();
        onUpdated();
      }
    } catch {
      // ignore
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDispatchUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transportName.trim() || !lrNumber.trim()) return;

    setIsUpdatingDispatch(true);
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transportName, lrNumber }),
      });
      const json = await res.json();
      if (json.ok) {
        setFeedback("Tracking / LR details updated.");
        setTimeout(() => setFeedback(null), 3000);
        await fetchDetail();
        onUpdated();
      } else {
        alert(json.message || "Failed to update dispatch info");
      }
    } catch {
      alert("Network error updating dispatch details");
    } finally {
      setIsUpdatingDispatch(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      const json = await res.json();
      if (json.ok) {
        setNewNote("");
        await fetchDetail();
      }
    } catch {
      // ignore
    } finally {
      setIsAddingNote(false);
    }
  };

  const openRevisionModal = () => {
    if (!enquiry) return;
    setRevisionReason("");
    setRevisedItems(
      enquiry.items.map((it: any) => ({
        ...it,
      }))
    );
    setRevisedExtraDiscount(paiseToRupees(enquiry.extraDiscountPaise || 0).toString());
    setRevisedShipping(paiseToRupees(enquiry.shippingPaise || 0).toString());
    setIsRevisionModalOpen(true);
  };

  const handleItemQtyChange = (index: number, qty: number) => {
    if (qty <= 0) {
      setRevisedItems(revisedItems.filter((_, idx) => idx !== index));
    } else {
      setRevisedItems(
        revisedItems.map((it, idx) =>
          idx === index ? { ...it, quantity: qty } : it
        )
      );
    }
  };

  const handleItemPriceChange = (index: number, rupees: string) => {
    const paise = Math.round((parseFloat(rupees) || 0) * 100);
    setRevisedItems(
      revisedItems.map((it, idx) =>
        idx === index ? { ...it, pricePaise: paise } : it
      )
    );
  };

  const calculatedRevisedSubtotal = revisedItems.reduce(
    (acc, it) => acc + it.pricePaise * it.quantity,
    0
  );
  const calculatedRevisedTotal = Math.max(
    0,
    calculatedRevisedSubtotal -
      rupeesToPaise(revisedExtraDiscount) +
      rupeesToPaise(revisedShipping)
  );

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionReason.trim() || revisionReason.trim().length < 5) {
      alert("A clear reason (at least 5 characters) is required for creating an enquiry revision.");
      return;
    }
    if (revisedItems.length === 0) {
      alert("Enquiry must contain at least one item.");
      return;
    }

    setIsSubmittingRevision(true);
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: revisionReason,
          items: revisedItems,
          extraDiscountPaise: rupeesToPaise(revisedExtraDiscount),
          shippingPaise: rupeesToPaise(revisedShipping),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Failed to revise enquiry.");
      }

      setFeedback("Enquiry revised successfully. Revision record logged.");
      setTimeout(() => setFeedback(null), 3000);
      setIsRevisionModalOpen(false);
      await fetchDetail();
      onUpdated();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error submitting revision");
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  const currentStatusConfig = enquiry ? STATUS_COLORS[enquiry.status as EnquiryStatus] : null;
  const isTerminalStatus = enquiry?.status === "COMPLETED" || enquiry?.status === "CANCELLED";

  // Build safe WhatsApp message for customer contact
  const customerWhatsAppUrl = enquiry
    ? `https://wa.me/91${(enquiry.whatsappNumber || enquiry.mobile).replace(/\D/g, "")}?text=${encodeURIComponent(
        `Vanakkam ${enquiry.customerName}, regarding your crackers enquiry ${enquiry.enquiryNumber} (Estimated Value: ${formatPaise(enquiry.totalEstimatePaise)}). How can we assist you with confirming your festive order?`
      )}`
    : "#";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-brand-bg-1 border-l border-white/10 h-full flex flex-col shadow-2xl relative overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-brand-bg-0/60">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white font-mono">
                  {enquiry ? enquiry.enquiryNumber : "Loading..."}
                </h2>
                {currentStatusConfig && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${currentStatusConfig.bg} ${currentStatusConfig.text} ${currentStatusConfig.border}`}
                  >
                    {enquiry.status}
                  </span>
                )}
              </div>
              {enquiry && (
                <div className="text-xs text-brand-muted flex items-center gap-2 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Submitted: {formatToKolkataTime(enquiry.createdAt)} (IST)</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {enquiry && (
              <a
                href={`/enquiry/summary/${enquiry.enquiryNumber}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-brand-muted hover:text-white transition-colors"
                title="Open Printable Estimate"
              >
                <Printer className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-brand-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback / Alerts */}
        {feedback && (
          <div className="mx-5 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
            <span className="font-semibold">{feedback}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {isLoading && !enquiry && (
            <div className="py-20 text-center text-brand-muted text-sm">
              Loading enquiry details...
            </div>
          )}

          {enquiry && (
            <>
              {/* Customer Info Card & Actions */}
              <div className="bg-brand-bg-0/60 rounded-2xl p-5 border border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {enquiry.customerName}
                    </h3>
                    <div className="text-xs text-brand-muted mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-brand-primary" />
                        {enquiry.mobile}
                      </span>
                      {enquiry.whatsappNumber && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          WA: {enquiry.whatsappNumber}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-accent-cyan" />
                        {enquiry.city}, {enquiry.state} - {enquiry.pincode}
                      </span>
                    </div>
                  </div>

                  {/* Call & WhatsApp Trigger Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`tel:${enquiry.mobile}`}
                      className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-bold flex items-center gap-1.5 border border-blue-500/30 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                    <a
                      href={customerWhatsAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/30 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  </div>
                </div>

                {/* Address & Preferences */}
                <div className="pt-3 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3 text-brand-muted">
                  <div>
                    <span className="font-semibold text-white/80 block mb-0.5">Delivery Address:</span>
                    <p className="text-white/70 whitespace-pre-wrap">{enquiry.address}</p>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="font-semibold text-white/80">Preferred Contact: </span>
                      <span className="text-white uppercase font-bold">{enquiry.preferredContact}</span>
                    </div>
                    {enquiry.customerNotes && (
                      <div>
                        <span className="font-semibold text-white/80 block">Customer Note:</span>
                        <p className="italic text-white/70">&quot;{enquiry.customerNotes}&quot;</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Update & Staff Assignment Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status Transition Control */}
                <div className="bg-brand-bg-0/60 rounded-2xl p-4 border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-brand-gold" />
                    Change Operational Status
                  </h4>

                  <form onSubmit={handleStatusChange} className="space-y-2.5">
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value as EnquiryStatus)}
                      className="w-full bg-brand-bg-1 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
                    >
                      <option value="">Select Next Status...</option>
                      <option value="CONTACTED">CONTACTED (Staff reached out)</option>
                      <option value="QUOTE_SENT">QUOTE SENT (Official estimate shared)</option>
                      <option value="AWAITING_CUSTOMER">AWAITING CUSTOMER (Waiting on confirmation)</option>
                      <option value="CONFIRMED">CONFIRMED (Customer approved quotation)</option>
                      <option value="READY">READY (Packed at Sivakasi)</option>
                      <option value="DISPATCHED">DISPATCHED (Booked with Transporter)</option>
                      <option value="COMPLETED">COMPLETED (Delivered / Handed over)</option>
                      <option value="CANCELLED">CANCELLED (Closed / Void)</option>
                    </select>

                    {isTerminalStatus && (
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                          <span>Reopening a completed/cancelled enquiry requires a mandatory reason.</span>
                          <input
                            type="text"
                            required
                            placeholder="Reopen reason (required)..."
                            value={reopenReason}
                            onChange={(e) => setReopenReason(e.target.value)}
                            className="mt-1.5 w-full bg-brand-bg-0 border border-white/10 rounded px-2 py-1 text-xs text-white"
                          />
                        </div>
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Optional timeline comment..."
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                      className="w-full bg-brand-bg-1 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-brand-muted">
                        <input
                          type="checkbox"
                          checked={statusVisibleToCustomer}
                          onChange={(e) => setStatusVisibleToCustomer(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-white/20 bg-brand-bg-1 text-brand-primary"
                        />
                        <span>Visible on tracking portal</span>
                      </label>

                      <Button
                        type="submit"
                        size="sm"
                        disabled={!nextStatus || isUpdatingStatus}
                        className="bg-brand-primary text-white text-xs h-8 px-3"
                      >
                        {isUpdatingStatus ? "Updating..." : "Update Status"}
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Staff Assignment & Dispatch Control */}
                <div className="space-y-4">
                  {/* Assign Staff */}
                  <div className="bg-brand-bg-0/60 rounded-2xl p-4 border border-white/10 space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-brand-accent-cyan" />
                      Assigned Operations Staff
                    </h4>
                    <select
                      value={assignedToId}
                      onChange={(e) => handleAssignChange(e.target.value)}
                      disabled={isAssigning}
                      className="w-full bg-brand-bg-1 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
                    >
                      <option value="">Unassigned</option>
                      {staffList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Transporter & LR Booking */}
                  <div className="bg-brand-bg-0/60 rounded-2xl p-4 border border-white/10 space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-brand-accent-lime" />
                      Transport Carrier & LR Number
                    </h4>
                    <form onSubmit={handleDispatchUpdate} className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="e.g. VRL Logistics"
                          value={transportName}
                          onChange={(e) => setTransportName(e.target.value)}
                          className="bg-brand-bg-1 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="LR / Bilty No."
                          value={lrNumber}
                          onChange={(e) => setLrNumber(e.target.value)}
                          className="bg-brand-bg-1 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div className="text-right">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isUpdatingDispatch}
                          className="bg-white/10 hover:bg-white/20 text-white text-xs h-7 px-3"
                        >
                          {isUpdatingDispatch ? "Saving..." : "Save Tracking Info"}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs (Items, Timeline, Internal Notes, Revisions) */}
              <div className="border-b border-white/10 flex items-center gap-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("items")}
                  className={`pb-3 transition-colors flex items-center gap-1.5 ${
                    activeTab === "items"
                      ? "text-brand-primary border-b-2 border-brand-primary"
                      : "text-brand-muted hover:text-white"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Items & Financials ({enquiry.items.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("timeline")}
                  className={`pb-3 transition-colors flex items-center gap-1.5 ${
                    activeTab === "timeline"
                      ? "text-brand-primary border-b-2 border-brand-primary"
                      : "text-brand-muted hover:text-white"
                  }`}
                >
                  <History className="w-4 h-4" />
                  Status Timeline ({enquiry.statusHistory.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("notes")}
                  className={`pb-3 transition-colors flex items-center gap-1.5 ${
                    activeTab === "notes"
                      ? "text-brand-primary border-b-2 border-brand-primary"
                      : "text-brand-muted hover:text-white"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Internal Notes ({enquiry.notes.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("revisions")}
                  className={`pb-3 transition-colors flex items-center gap-1.5 ${
                    activeTab === "revisions"
                      ? "text-brand-primary border-b-2 border-brand-primary"
                      : "text-brand-muted hover:text-white"
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  Revision History ({enquiry.revisions.length})
                </button>
              </div>

              {/* Tab 1: Items & Totals */}
              {activeTab === "items" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-brand-muted">
                      Snapshot items locked at time of submission / latest revision.
                    </span>
                    <Button
                      size="sm"
                      onClick={openRevisionModal}
                      className="bg-brand-gold/20 text-brand-gold hover:bg-brand-gold/30 border border-brand-gold/30 text-xs flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Create Revision
                    </Button>
                  </div>

                  <div className="bg-brand-bg-0/60 rounded-2xl border border-white/10 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 border-b border-white/10 text-brand-muted font-bold">
                        <tr>
                          <th className="p-3">Item Details</th>
                          <th className="p-3">Rate (₹)</th>
                          <th className="p-3 text-center">Qty</th>
                          <th className="p-3 text-right">Line Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {enquiry.items.map((it: any) => (
                          <tr key={it.id} className="hover:bg-white/[0.02]">
                            <td className="p-3">
                              <div className="font-bold text-white">{it.name}</div>
                              <div className="text-[10px] text-brand-muted font-mono">
                                SKU: {it.sku} • {it.packSize}
                              </div>
                            </td>
                            <td className="p-3 font-mono text-white/90">
                              {formatPaise(it.pricePaise)}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-white">
                              {it.quantity}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-brand-gold">
                              {formatPaise(it.lineTotalPaise)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals Summary */}
                    <div className="p-4 bg-brand-bg-1/80 border-t border-white/10 space-y-1.5 text-xs text-brand-muted">
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span className="font-mono text-white">
                          {formatPaise(enquiry.subtotalPaise)}
                        </span>
                      </div>
                      {enquiry.extraDiscountPaise > 0 && (
                        <div className="flex justify-between text-emerald-400">
                          <span>Special Discount:</span>
                          <span className="font-mono">
                            - {formatPaise(enquiry.extraDiscountPaise)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Shipping / Freight Estimate:</span>
                        <span className="font-mono text-white">
                          {enquiry.shippingPaise === 0
                            ? "To Be Confirmed"
                            : formatPaise(enquiry.shippingPaise)}
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-black text-brand-gold pt-2 border-t border-white/10">
                        <span>Total Estimated Amount:</span>
                        <span className="font-mono">
                          {formatPaise(enquiry.totalEstimatePaise)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Timeline */}
              {activeTab === "timeline" && (
                <div className="space-y-4">
                  <div className="relative pl-6 border-l-2 border-white/10 space-y-6 my-2">
                    {enquiry.statusHistory.map((h: any) => (
                      <div key={h.id} className="relative">
                        <div className="absolute -left-[31px] top-0 w-3.5 h-3.5 rounded-full bg-brand-primary ring-4 ring-brand-bg-1" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {h.fromStatus ? `${h.fromStatus} → ` : ""}
                              {h.toStatus}
                            </span>
                            <span className="text-[10px] text-brand-muted">
                              {formatToKolkataTime(h.createdAt)}
                            </span>
                          </div>
                          {h.comment && (
                            <p className="text-xs text-white/80 mt-1 bg-white/5 rounded-lg p-2 border border-white/5">
                              {h.comment}
                            </p>
                          )}
                          <div className="text-[10px] text-brand-muted mt-0.5">
                            {h.visibleToCustomer ? "✓ Visible to customer" : "🔒 Internal staff only"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Internal Notes */}
              {activeTab === "notes" && (
                <div className="space-y-4">
                  <form onSubmit={handleAddNote} className="space-y-2">
                    <textarea
                      rows={2}
                      required
                      placeholder="Add an internal staff note (never visible to customer)..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="w-full bg-brand-bg-0 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-primary resize-none"
                    />
                    <div className="text-right">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isAddingNote || !newNote.trim()}
                        className="bg-brand-primary text-white text-xs h-8 px-4 flex items-center gap-1.5 ml-auto"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Post Note
                      </Button>
                    </div>
                  </form>

                  <div className="space-y-3 pt-2">
                    {enquiry.notes.map((note: any) => (
                      <div
                        key={note.id}
                        className="p-3 bg-brand-bg-0/60 rounded-xl border border-white/5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-brand-muted">
                          <span className="font-bold text-brand-accent-cyan">
                            {note.author.name}
                          </span>
                          <span>{formatToKolkataTime(note.createdAt)}</span>
                        </div>
                        <p className="text-white/90 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))}

                    {enquiry.notes.length === 0 && (
                      <div className="py-8 text-center text-xs text-brand-muted">
                        No internal notes yet. Use the field above to document customer discussions.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Revisions */}
              {activeTab === "revisions" && (
                <div className="space-y-4">
                  <p className="text-xs text-brand-muted">
                    Every time enquiry items or pricing are modified, an immutable revision snapshot is saved.
                  </p>

                  <div className="space-y-4">
                    {enquiry.revisions.map((rev: any) => (
                      <div
                        key={rev.id}
                        className="p-4 bg-brand-bg-0/60 rounded-xl border border-white/10 text-xs space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <span className="font-bold text-white flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-brand-gold/20 text-brand-gold font-mono">
                              Revision #{rev.revisionNumber}
                            </span>
                            <span className="text-brand-muted text-[11px]">
                              {formatToKolkataTime(rev.createdAt)}
                            </span>
                          </span>
                          <span className="font-mono text-brand-gold font-bold">
                            Total: {formatPaise(rev.afterSnapshot.totalEstimatePaise)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-brand-muted font-bold uppercase block mb-0.5">
                            Reason for modification:
                          </span>
                          <p className="text-white/90 bg-white/5 p-2 rounded-lg italic">
                            &quot;{rev.reason}&quot;
                          </p>
                        </div>

                        <div className="text-[11px] text-brand-muted">
                          Items count: {rev.afterSnapshot.items.length} • Subtotal:{" "}
                          {formatPaise(rev.afterSnapshot.subtotalPaise)}
                        </div>
                      </div>
                    ))}

                    {enquiry.revisions.length === 0 && (
                      <div className="py-8 text-center text-xs text-brand-muted">
                        No revisions recorded. Enquiry retains its original submission snapshot.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Revision Modal */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-brand-bg-1 border border-white/20 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setIsRevisionModalOpen(false)}
              className="absolute top-5 right-5 text-brand-muted hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-1">
              <Edit3 className="w-5 h-5 text-brand-gold" />
              Revise Enquiry #{enquiry.enquiryNumber}
            </h3>
            <p className="text-xs text-brand-muted mb-4">
              Modify item quantities, unit rates, extra discounts, or shipping. A mandatory reason is required.
            </p>

            <form onSubmit={handleSubmitRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white uppercase mb-1">
                  Revision Reason (Mandatory) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer requested removing 1 Sparkler box and adding extra 5% bulk discount"
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              {/* Items List */}
              <div className="bg-brand-bg-0/60 rounded-xl p-3 border border-white/10 max-h-60 overflow-y-auto space-y-2">
                <div className="text-[11px] font-bold text-brand-muted uppercase mb-1">
                  Items ({revisedItems.length})
                </div>
                {revisedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-brand-bg-1/80 border border-white/5 rounded-lg p-2 text-xs"
                  >
                    <div className="truncate max-w-[200px]">
                      <div className="font-bold text-white truncate">{item.name}</div>
                      <div className="text-[10px] text-brand-muted font-mono">{item.sku}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-brand-muted">₹:</span>
                        <input
                          type="number"
                          step="0.01"
                          value={paiseToRupees(item.pricePaise)}
                          onChange={(e) => handleItemPriceChange(idx, e.target.value)}
                          className="w-16 bg-brand-bg-0 border border-white/10 rounded px-1 text-xs text-white font-mono text-center"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-brand-muted">Qty:</span>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemQtyChange(idx, parseInt(e.target.value) || 1)}
                          className="w-12 bg-brand-bg-0 border border-white/10 rounded px-1 text-xs text-white font-mono text-center"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleItemQtyChange(idx, 0)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Adjustments */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-brand-muted uppercase mb-1">
                    Special Discount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={revisedExtraDiscount}
                    onChange={(e) => setRevisedExtraDiscount(e.target.value)}
                    className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-brand-muted uppercase mb-1">
                    Shipping / Freight (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={revisedShipping}
                    onChange={(e) => setRevisedShipping(e.target.value)}
                    className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              {/* Revised Totals */}
              <div className="p-3 bg-brand-bg-0 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                <span className="text-brand-muted">New Estimated Total:</span>
                <span className="text-base font-black text-brand-gold font-mono">
                  {formatPaise(calculatedRevisedTotal)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRevisionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingRevision}
                  className="bg-brand-primary text-white"
                >
                  {isSubmittingRevision ? "Saving Revision..." : "Confirm & Save Revision"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
