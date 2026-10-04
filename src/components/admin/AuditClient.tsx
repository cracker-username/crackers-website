"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import { formatToKolkataTime } from "@/lib/utils/dates";

interface AuditLogItem {
  id: string;
  actorId?: string | null;
  actor?: { id: string; name: string; email: string; role: string } | null;
  action: string;
  entity: string;
  entityId: string;
  beforeData?: any;
  afterData?: any;
  ipAddress?: string | null;
  createdAt: string;
}

interface ActorOption {
  id: string;
  name: string;
}

interface AuditClientProps {
  initialLogs: AuditLogItem[];
  actors: ActorOption[];
}

export function AuditClient({ initialLogs, actors }: AuditClientProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>(initialLogs);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Filters
  const [actionSearch, setActionSearch] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("");
  const [selectedActor, setSelectedActor] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (actionSearch.trim()) params.set("action", actionSearch.trim());
      if (selectedEntity) params.set("entity", selectedEntity);
      if (selectedActor) params.set("actorId", selectedActor);

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const json = await res.json();
      if (json.ok) {
        setLogs(json.data.logs);
        setTotalPages(json.data.pagination.totalPages);
        setTotalLogs(json.data.pagination.total);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  }, [page, actionSearch, selectedEntity, selectedActor]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-gold" />
            Administrative Audit Log & Trail
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Immutable log of all catalogue modifications, price changes, enquiry revisions, settings updates, and staff actions.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-brand-bg-1/80 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action (e.g. PRODUCT_UPDATE, ENQUIRY_STATUS_CHANGE)..."
            value={actionSearch}
            onChange={(e) => {
              setActionSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-brand-bg-0 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-brand-muted/60 focus:outline-none focus:border-brand-primary"
          />
        </div>

        <select
          value={selectedEntity}
          onChange={(e) => {
            setSelectedEntity(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-44 bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
        >
          <option value="">All Entities</option>
          <option value="Product">Product</option>
          <option value="Enquiry">Enquiry</option>
          <option value="Category">Category</option>
          <option value="Combo">Combo</option>
          <option value="Setting">Setting</option>
          <option value="DeliveryRule">DeliveryRule</option>
          <option value="AdminUser">AdminUser</option>
          <option value="Banner">Banner</option>
          <option value="Page">Page</option>
        </select>

        <select
          value={selectedActor}
          onChange={(e) => {
            setSelectedActor(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-44 bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
        >
          <option value="">All Actors</option>
          {actors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-brand-bg-1/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-brand-bg-0/60 text-brand-muted uppercase text-[10px] font-bold border-b border-white/10">
            <tr>
              <th className="p-4">Timestamp (IST)</th>
              <th className="p-4">Actor</th>
              <th className="p-4">Action</th>
              <th className="p-4">Entity</th>
              <th className="p-4">Entity ID</th>
              <th className="p-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-sans">
            {isLoading && logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-brand-muted">
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-brand-muted">
                  No audit log entries matching filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 text-brand-muted font-mono whitespace-nowrap">
                    {formatToKolkataTime(log.createdAt)}
                  </td>
                  <td className="p-4">
                    {log.actor ? (
                      <div>
                        <span className="font-bold text-white">{log.actor.name}</span>
                        <span className="text-[10px] text-brand-muted block font-mono">
                          {log.actor.role}
                        </span>
                      </div>
                    ) : (
                      <span className="text-brand-muted italic">System Automated</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-white/5 border border-white/10 text-brand-accent-cyan">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-white/90">{log.entity}</td>
                  <td className="p-4 font-mono text-[11px] text-brand-muted max-w-[120px] truncate">
                    {log.entityId}
                  </td>
                  <td className="p-4 text-right">
                    {(log.beforeData || log.afterData) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLog(log)}
                        className="h-7 text-xs px-2.5"
                      >
                        <Eye className="w-3 h-3 mr-1" /> View Diff
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-brand-muted">
          <div>
            Showing <span className="font-bold text-white">{logs.length}</span> of{" "}
            <span className="font-bold text-white">{totalLogs}</span> entries (Page {page} of {totalPages})
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

      {/* Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-brand-bg-1 border border-white/20 rounded-2xl w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 text-brand-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <span className="font-mono text-brand-gold">{selectedLog.action}</span>
              <span className="text-brand-muted text-xs">({selectedLog.entity})</span>
            </h3>
            <p className="text-xs text-brand-muted mb-4 font-mono">
              Entity ID: {selectedLog.entityId} • {formatToKolkataTime(selectedLog.createdAt)}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-brand-muted uppercase block mb-1">Before State</span>
                <pre className="p-3 bg-brand-bg-0 border border-white/10 rounded-xl overflow-x-auto text-[11px] text-brand-muted font-mono max-h-72">
                  {JSON.stringify(selectedLog.beforeData, null, 2) || "None (Created)"}
                </pre>
              </div>

              <div>
                <span className="font-bold text-brand-accent-cyan uppercase block mb-1">
                  After State
                </span>
                <pre className="p-3 bg-brand-bg-0 border border-white/10 rounded-xl overflow-x-auto text-[11px] text-brand-accent-cyan font-mono max-h-72">
                  {JSON.stringify(selectedLog.afterData, null, 2) || "None (Deleted)"}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
