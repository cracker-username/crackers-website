"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import {
  Bell,
  RefreshCw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { formatToKolkataTime } from "@/lib/utils/dates";
import { OutboxStatus } from "@prisma/client";

interface OutboxEventItem {
  id: string;
  type: string;
  payload: any;
  status: OutboxStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string;
  lastError?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

interface NotificationsClientProps {
  initialEvents: OutboxEventItem[];
  initialStats: Record<string, number>;
}

const STATUS_PILL: Record<OutboxStatus, { bg: string; text: string; border: string }> = {
  PENDING: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  PROCESSING: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  SENT: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  FAILED: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
  DEAD: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/40" },
};

export function NotificationsClient({ initialEvents, initialStats }: NotificationsClientProps) {
  const [events, setEvents] = useState<OutboxEventItem[]>(initialEvents);
  const [stats, setStats] = useState<Record<string, number>>(initialStats);
  const [selectedStatus, setSelectedStatus] = useState<OutboxStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);

      const res = await fetch(`/api/admin/notifications?${params.toString()}`);
      const json = await res.json();
      if (json.ok) {
        setEvents(json.data.events);
        setTotalPages(json.data.pagination.totalPages);
        setTotalEvents(json.data.pagination.total);
        setStats(json.data.stats || {});
      }
    } catch {}
  }, [page, selectedStatus]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRetry = async (eventId: string) => {
    setRetryingId(eventId);
    try {
      const res = await fetch("/api/admin/notifications/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const json = await res.json();
      if (json.ok) {
        setFeedback("Event reset to PENDING for immediate processing.");
        setTimeout(() => setFeedback(null), 3000);
        await fetchEvents();
      } else {
        alert(json.message || "Failed to retry event");
      }
    } catch {
      alert("Error retrying event");
    } finally {
      setRetryingId(null);
    }
  };

  const statusTabs: Array<{ label: string; value: OutboxStatus | "ALL" }> = [
    { label: "All Events", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Processing", value: "PROCESSING" },
    { label: "Sent", value: "SENT" },
    { label: "Failed", value: "FAILED" },
    { label: "Dead Letter", value: "DEAD" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-gold" />
            Outbox Notifications & Dispatch Queue
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Track background notification emails, monitor retry attempts, and inspect delivery errors.
          </p>
        </div>

        <Button
          onClick={fetchEvents}
          variant="outline"
          size="sm"
          className="border-white/10 text-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Queue
        </Button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {feedback}
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
        {statusTabs.map((tab) => {
          const isActive = selectedStatus === tab.value;
          const count = tab.value === "ALL" ? stats.TOTAL ?? 0 : stats[tab.value] ?? 0;

          return (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-brand-primary text-white"
                  : "bg-brand-bg-1/80 text-brand-muted hover:text-white border border-white/5"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  isActive ? "bg-white/20 text-white" : "bg-white/5 text-brand-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Events Table */}
      <div className="bg-brand-bg-1/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-brand-bg-0/60 text-brand-muted uppercase text-[10px] font-bold border-b border-white/10">
            <tr>
              <th className="p-4">Event Type / ID</th>
              <th className="p-4">Status</th>
              <th className="p-4">Attempts</th>
              <th className="p-4">Next Attempt / Processed</th>
              <th className="p-4">Error Diagnostics</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-sans">
            {events.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-brand-muted">
                  No outbox events currently in queue.
                </td>
              </tr>
            ) : (
              events.map((ev) => {
                const statusCfg = STATUS_PILL[ev.status] || {
                  bg: "bg-white/5",
                  text: "text-white",
                  border: "border-white/10",
                };

                const canRetry = ev.status === "FAILED" || ev.status === "DEAD";

                return (
                  <tr key={ev.id} className="hover:bg-white/[0.02]">
                    <td className="p-4">
                      <div className="font-bold text-white font-mono">{ev.type}</div>
                      <div className="text-[10px] text-brand-muted font-mono">{ev.id}</div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {ev.status}
                      </span>
                    </td>

                    <td className="p-4 font-mono">
                      <span
                        className={
                          ev.attempts >= ev.maxAttempts ? "text-rose-400 font-bold" : "text-white"
                        }
                      >
                        {ev.attempts}
                      </span>{" "}
                      / <span className="text-brand-muted">{ev.maxAttempts}</span>
                    </td>

                    <td className="p-4 text-brand-muted font-mono text-[11px]">
                      {ev.processedAt
                        ? `Processed: ${formatToKolkataTime(ev.processedAt)}`
                        : `Next: ${formatToKolkataTime(ev.nextAttemptAt)}`}
                    </td>

                    <td className="p-4 max-w-xs">
                      {ev.lastError ? (
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-mono line-clamp-2">
                          {ev.lastError}
                        </div>
                      ) : (
                        <span className="text-brand-muted italic">None</span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      {canRetry && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={retryingId === ev.id}
                          onClick={() => handleRetry(ev.id)}
                          className="h-7 text-xs px-2.5 border-white/20 text-brand-gold hover:bg-brand-gold/10"
                        >
                          {retryingId === ev.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <RefreshCw className="w-3 h-3 mr-1" />
                          )}
                          Retry
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-brand-muted">
          <div>
            Showing <span className="font-bold text-white">{events.length}</span> of{" "}
            <span className="font-bold text-white">{totalEvents}</span> events
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-8 px-2.5 text-xs"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="h-8 px-2.5 text-xs"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
