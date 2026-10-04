import React from "react";
import Link from "next/link";
import {
  Calendar,
  TrendingUp,
  ClipboardList,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Package,
  MapPin,
  ExternalLink,
  Clock,
  ArrowRight,
} from "lucide-react";
import { getDashboardMetrics } from "@/lib/services/dashboardService";
import { formatPaise } from "@/lib/utils/money";
import { formatIstDateOnly } from "@/lib/utils/dates";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  NEW: { label: "New Enquiries", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  CONTACTED: { label: "Contacted", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  QUOTE_SENT: { label: "Quote Sent", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  AWAITING_CUSTOMER: { label: "Awaiting Reply", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  CONFIRMED: { label: "Confirmed", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  READY: { label: "Packed & Ready", color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/30" },
  DISPATCHED: { label: "Dispatched", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  COMPLETED: { label: "Completed", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  CANCELLED: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
};

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();

  // Find maximum value in 7-day trends for scaling chart bars
  const maxTrendCount = Math.max(1, ...metrics.sevenDayTrends.map((t) => t.count));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-text">
            Operations Dashboard
          </h1>
          <p className="text-xs text-muted mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-accent-gold" />
            Live metrics evaluated against Indian Standard Time (IST: UTC+05:30)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/price-list" target="_blank">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <ExternalLink className="w-3.5 h-3.5" />
              View Catalogue
            </Button>
          </Link>
          <Link href="/admin/enquiries">
            <Button variant="primary" size="sm" className="gap-2 text-xs">
              <ClipboardList className="w-3.5 h-3.5" />
              Manage Enquiries
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Enquiries Today */}
        <div className="p-4 rounded-xl bg-surface-1 border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today (IST)</span>
            <div className="w-7 h-7 rounded-lg bg-accent-gold/10 text-accent-gold flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-heading text-text">
              {metrics.enquiriesToday}
            </div>
            <p className="text-[11px] text-muted mt-0.5">Enquiries submitted today</p>
          </div>
        </div>

        {/* Enquiries This Week */}
        <div className="p-4 rounded-xl bg-surface-1 border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">This Week (IST)</span>
            <div className="w-7 h-7 rounded-lg bg-accent-orange/10 text-accent-orange flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-heading text-text">
              {metrics.enquiriesThisWeek}
            </div>
            <p className="text-[11px] text-muted mt-0.5">Since Monday midnight</p>
          </div>
        </div>

        {/* Total Active Enquiries */}
        <div className="p-4 rounded-xl bg-surface-1 border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Enquiries</span>
            <div className="w-7 h-7 rounded-lg bg-accent-magenta/10 text-accent-magenta flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-heading text-text">
              {metrics.totalEnquiries}
            </div>
            <p className="text-[11px] text-muted mt-0.5">All active festival records</p>
          </div>
        </div>

        {/* Total Enquiry Value */}
        <div className="p-4 rounded-xl bg-surface-1 border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pipeline Value</span>
            <div className="w-7 h-7 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-price text-accent-gold">
              {formatPaise(metrics.totalEnquiryValuePaise)}
            </div>
            <p className="text-[11px] text-muted mt-0.5">Sum of fireworks estimates</p>
          </div>
        </div>

        {/* Confirmed or Later Share */}
        <div className="p-4 rounded-xl bg-surface-1 border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Confirmed Share</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-heading text-emerald-400">
              {metrics.confirmedSharePercent}%
            </div>
            <p className="text-[10px] text-muted mt-0.5 leading-tight">
              Confirmed, Packed, Dispatched, or Delivered
            </p>
          </div>
        </div>
      </div>

      {/* 7-Day Performance Trend Chart */}
      <div className="p-6 rounded-2xl bg-surface-1 border border-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base font-heading text-text">
              7-Day Enquiry Volume (IST Days)
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Daily enquiry counts and cumulative estimated fireworks value
            </p>
          </div>
          <span className="text-xs text-muted">Past 7 Days</span>
        </div>

        {/* SVG / Bar Chart */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-6 items-end h-44 border-b border-border pb-3">
          {metrics.sevenDayTrends.map((t, idx) => {
            const heightPercent = Math.max(10, Math.round((t.count / maxTrendCount) * 100));

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                {/* Tooltip / value indicator on hover */}
                <span className="text-[10px] font-mono text-muted mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t.count} enq
                </span>

                {/* Animated bar */}
                <div
                  className="w-full max-w-[42px] bg-gradient-to-t from-accent-magenta/60 to-accent-orange/80 rounded-t-lg transition-all duration-500 group-hover:from-accent-magenta group-hover:to-accent-orange"
                  style={{ height: `${heightPercent}%` }}
                />

                {/* Day label */}
                <span className="text-[10px] text-muted font-medium mt-2 text-center truncate w-full">
                  {t.dateLabel.split(" ")[0]} {t.dateLabel.split(" ")[1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enquiries by Status Grid */}
      <div className="p-6 rounded-2xl bg-surface-1 border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base font-heading text-text">
            Enquiries by Operational Status
          </h3>
          <Link
            href="/admin/enquiries"
            className="text-xs text-accent-gold hover:underline flex items-center gap-1"
          >
            Manage Enquiries <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
          {Object.entries(STATUS_CONFIG).map(([statusKey, cfg]) => {
            const count = metrics.statusCounts[statusKey as keyof typeof metrics.statusCounts] || 0;
            return (
              <div
                key={statusKey}
                className={`p-3 rounded-xl border ${cfg.bg} ${cfg.border} flex flex-col justify-between`}
              >
                <span className="text-[11px] font-bold text-muted truncate">{cfg.label}</span>
                <span className={`text-xl font-black font-heading mt-1 ${cfg.color}`}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory & Notifications Health Alert Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Out of stock alert */}
        <div className="p-4 rounded-xl bg-surface-1 border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-text">Out of Stock Products</p>
              <p className="text-[11px] text-muted">Products currently unavailable</p>
            </div>
          </div>
          <span
            className={`text-lg font-black ${
              metrics.outOfStockCount > 0 ? "text-red-400" : "text-muted"
            }`}
          >
            {metrics.outOfStockCount}
          </span>
        </div>

        {/* Low stock alert */}
        <div className="p-4 rounded-xl bg-surface-1 border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-text">Limited Stock Items</p>
              <p className="text-[11px] text-muted">Marked with limited stock flag</p>
            </div>
          </div>
          <span className="text-lg font-black text-amber-400">
            {metrics.lowStockCount}
          </span>
        </div>

        {/* Notification queue health */}
        <div className="p-4 rounded-xl bg-surface-1 border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-text">Failed Notifications</p>
              <p className="text-[11px] text-muted">Outbox events awaiting retry</p>
            </div>
          </div>
          <Link href="/admin/notifications">
            <span
              className={`text-lg font-black hover:underline cursor-pointer ${
                metrics.failedNotificationsCount > 0 ? "text-red-400" : "text-muted"
              }`}
            >
              {metrics.failedNotificationsCount}
            </span>
          </Link>
        </div>
      </div>

      {/* Top Insights: Products & States */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Demand Products */}
        <div className="p-6 rounded-2xl bg-surface-1 border border-border shadow-sm space-y-4">
          <h3 className="font-bold text-base font-heading text-text flex items-center gap-2">
            <Package className="w-4 h-4 text-accent-gold" />
            Top Fireworks by Demand
          </h3>

          {metrics.topProducts.length === 0 ? (
            <p className="text-xs text-muted py-4 text-center">No enquiry items logged yet.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {metrics.topProducts.map((p, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-muted font-bold">{idx + 1}.</span>
                    <span className="font-semibold text-text">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-accent-gold">{p.quantity} units</span>
                    <span className="text-muted ml-2">({formatPaise(p.totalPaise)})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top States */}
        <div className="p-6 rounded-2xl bg-surface-1 border border-border shadow-sm space-y-4">
          <h3 className="font-bold text-base font-heading text-text flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent-orange" />
            Top Regional States
          </h3>

          {metrics.topStates.length === 0 ? (
            <p className="text-xs text-muted py-4 text-center">No regional enquiries logged yet.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {metrics.topStates.map((st, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-muted font-bold">{idx + 1}.</span>
                    <span className="font-semibold text-text">{st.state}</span>
                  </div>
                  <span className="font-mono font-bold text-text">{st.count} enquiries</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="p-6 rounded-2xl bg-surface-1 border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base font-heading text-text">
              Recent Enquiries Activity
            </h3>
            <p className="text-xs text-muted mt-0.5">Latest customer submissions received</p>
          </div>
          <Link href="/admin/enquiries">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {metrics.recentEnquiries.length === 0 ? (
          <p className="text-xs text-muted py-8 text-center">No recent enquiries found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted uppercase text-[11px]">
                  <th className="py-2 px-3">Enquiry No</th>
                  <th className="py-2 px-3">Customer</th>
                  <th className="py-2 px-3">Location</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Estimate</th>
                  <th className="py-2 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {metrics.recentEnquiries.map((e) => {
                  const defaultCfg = STATUS_CONFIG["NEW"]!;
                  const cfg = STATUS_CONFIG[e.status] ?? defaultCfg;

                  return (
                    <tr key={e.id} className="hover:bg-surface-2/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-accent-gold">
                        {e.enquiryNumber}
                      </td>
                      <td className="py-3 px-3 font-medium text-text">{e.customerName}</td>
                      <td className="py-3 px-3 text-muted">{e.state}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cfg.bg} ${cfg.color} border ${cfg.border}`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-price font-bold text-text">
                        {formatPaise(e.totalEstimatePaise)}
                      </td>
                      <td className="py-3 px-3 text-right text-muted">
                        {formatIstDateOnly(e.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
