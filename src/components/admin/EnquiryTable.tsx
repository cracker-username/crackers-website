"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatPaise } from "@/lib/utils/money";
import { formatToKolkataTime } from "@/lib/utils/dates";
import { Button } from "@/components/ui/Button";
import {
  Search,
  Download,
  Phone,
  MessageCircle,
  Eye,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { EnquiryStatus } from "@prisma/client";
import { EnquiryDetailDrawer } from "./EnquiryDetailDrawer";

interface StaffOption {
  id: string;
  name: string;
  email: string;
}

interface StateOption {
  id: string;
  code: string;
  name: string;
}

interface EnquiryTableProps {
  staffList: StaffOption[];
  statesList: StateOption[];
}

const STATUS_TABS: Array<{ label: string; value: EnquiryStatus | "ALL" }> = [
  { label: "All Enquiries", value: "ALL" },
  { label: "New", value: "NEW" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Quote Sent", value: "QUOTE_SENT" },
  { label: "Awaiting Customer", value: "AWAITING_CUSTOMER" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Ready", value: "READY" },
  { label: "Dispatched", value: "DISPATCHED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const STATUS_PILL: Record<EnquiryStatus, { bg: string; text: string; border: string }> = {
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

export function EnquiryTable({ staffList, statesList }: EnquiryTableProps) {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<EnquiryStatus | "ALL">("ALL");
  const [selectedState, setSelectedState] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEnquiries, setTotalEnquiries] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEnquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
      });
      if (search.trim()) params.set("search", search.trim());
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (selectedState) params.set("state", selectedState);
      if (selectedStaff) params.set("assignedToId", selectedStaff);

      const res = await fetch(`/api/admin/enquiries?${params.toString()}`);
      const json = await res.json();

      if (json.ok) {
        setEnquiries(json.data.enquiries);
        setTotalPages(json.data.pagination.totalPages);
        setTotalEnquiries(json.data.pagination.total);
        setStats(json.data.stats || {});
      }
    } catch (err) {
      console.error("Failed to fetch enquiries:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedStatus, selectedState, selectedStaff]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchEnquiries();
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchEnquiries]);

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (selectedStatus !== "ALL") params.set("status", selectedStatus);
    if (selectedState) params.set("state", selectedState);

    window.open(`/api/admin/enquiries/export-csv?${params.toString()}`, "_blank");
  };

  const handleArchive = async (id: string, num: string) => {
    if (!confirm(`Are you sure you want to archive enquiry ${num}?`)) return;

    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        await fetchEnquiries();
      } else {
        alert(json.message || "Failed to archive enquiry");
      }
    } catch {
      alert("Network error archiving enquiry");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-gold" />
            Customer Enquiries Management
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Review customer orders, transition operational statuses, assign staff, and track estimates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCsv}
            variant="outline"
            size="sm"
            className="border-white/10 hover:border-white/20 text-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-brand-accent-cyan" />
            Export Enquiries CSV
          </Button>
        </div>
      </div>

      {/* Status Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/10">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedStatus === tab.value;
          const count = tab.value === "ALL" ? stats.TOTAL ?? 0 : stats[tab.value] ?? 0;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                  : "bg-brand-bg-1/80 text-brand-muted hover:text-white border border-white/5"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  isActive ? "bg-white/20 text-white" : "bg-white/5 text-brand-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-brand-bg-1/80 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Enquiry #, Customer Name, Mobile, or City..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-bg-0 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-brand-muted/60 focus:outline-none focus:border-brand-primary"
          />
        </div>

        {/* State filter */}
        <select
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-44 bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
        >
          <option value="">All States</option>
          {statesList.map((st) => (
            <option key={st.code} value={st.name}>
              {st.name}
            </option>
          ))}
        </select>

        {/* Staff filter */}
        <select
          value={selectedStaff}
          onChange={(e) => {
            setSelectedStaff(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-44 bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
        >
          <option value="">All Staff</option>
          {staffList.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table & Mobile Cards */}
      <div className="bg-brand-bg-1/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-brand-bg-0/60 text-brand-muted uppercase text-[10px] font-bold tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4">Enquiry #</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Location</th>
                <th className="p-4">Items / Total</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assigned To</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {isLoading && enquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-brand-muted">
                    Loading customer enquiries...
                  </td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-brand-muted">
                    No customer enquiries found matching the selected filters.
                  </td>
                </tr>
              ) : (
                enquiries.map((enq) => {
                  const statusCfg = STATUS_PILL[enq.status as EnquiryStatus] || {
                    bg: "bg-white/5",
                    text: "text-white",
                    border: "border-white/10",
                  };

                  const waUrl = `https://wa.me/91${(enq.whatsappNumber || enq.mobile).replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Vanakkam ${enq.customerName}, regarding your crackers enquiry ${enq.enquiryNumber}.`
                  )}`;

                  return (
                    <tr
                      key={enq.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => setSelectedEnquiryId(enq.id)}
                    >
                      {/* Enquiry # & Date */}
                      <td className="p-4">
                        <div className="font-mono font-bold text-white text-sm">
                          {enq.enquiryNumber}
                        </div>
                        <div className="text-[10px] text-brand-muted flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatToKolkataTime(enq.createdAt)}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="p-4">
                        <div className="font-bold text-white">{enq.customerName}</div>
                        <div className="text-[11px] text-brand-muted font-mono">{enq.mobile}</div>
                      </td>

                      {/* Location */}
                      <td className="p-4">
                        <div className="text-white/90">{enq.city}</div>
                        <div className="text-[10px] text-brand-muted">{enq.state}</div>
                      </td>

                      {/* Items & Financials */}
                      <td className="p-4">
                        <div className="font-bold text-brand-gold font-mono text-sm">
                          {formatPaise(enq.totalEstimatePaise)}
                        </div>
                        <div className="text-[10px] text-brand-muted">
                          {enq._count?.items ?? 0} items
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          {enq.status}
                        </span>
                      </td>

                      {/* Assigned Staff */}
                      <td className="p-4">
                        {enq.assignedTo ? (
                          <span className="text-xs text-white/90 font-medium">
                            {enq.assignedTo.name}
                          </span>
                        ) : (
                          <span className="text-xs text-brand-muted italic">Unassigned</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="p-4 text-right space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={`tel:${enq.mobile}`}
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 inline-block transition-colors"
                          title="Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 inline-block transition-colors"
                          title="WhatsApp Customer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setSelectedEnquiryId(enq.id)}
                          className="p-1.5 rounded-lg bg-white/5 text-white/80 hover:bg-white/10 hover:text-white inline-block transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchive(enq.id, enq.enquiryNumber)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 inline-block transition-colors"
                          title="Archive Enquiry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-muted">
          <div>
            Showing <span className="text-white font-bold">{enquiries.length}</span> of{" "}
            <span className="text-white font-bold">{totalEnquiries}</span> enquiries
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-8 px-2.5 text-xs border-white/10"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-xs px-2">
              Page <span className="text-white font-bold">{page}</span> of{" "}
              <span className="text-white font-bold">{totalPages}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="h-8 px-2.5 text-xs border-white/10"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Slide-over Enquiry Detail Drawer */}
      <EnquiryDetailDrawer
        enquiryId={selectedEnquiryId}
        onClose={() => setSelectedEnquiryId(null)}
        staffList={staffList}
        onUpdated={fetchEnquiries}
      />
    </div>
  );
}
