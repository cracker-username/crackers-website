"use client";

import React, { useState } from "react";
import { formatPaise, paiseToRupees, rupeesToPaise } from "@/lib/utils/money";
import { Button } from "@/components/ui/Button";
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  ShieldAlert,
} from "lucide-react";
import { ShippingMode } from "@prisma/client";

interface StateOption {
  id: string;
  code: string;
  name: string;
}

interface DeliveryRuleItem {
  id: string;
  name: string;
  isDefault: boolean;
  isDeliverable: boolean;
  minOrderPaise: number;
  shippingMode: ShippingMode;
  freeShippingThresholdPaise?: number | null;
  messageText: string;
  priority: number;
  isActive: boolean;
  states: StateOption[];
}

interface RestrictedPincodeItem {
  pincode: string;
  reason?: string | null;
  createdAt: string;
}

interface DeliveryRulesClientProps {
  initialRules: DeliveryRuleItem[];
  allStates: StateOption[];
  initialPincodes: RestrictedPincodeItem[];
}

export function DeliveryRulesClient({
  initialRules,
  allStates,
  initialPincodes,
}: DeliveryRulesClientProps) {
  const [activeTab, setActiveTab] = useState<"rules" | "pincodes">("rules");
  const [rules, setRules] = useState<DeliveryRuleItem[]>(initialRules);
  const [pincodes, setPincodes] = useState<RestrictedPincodeItem[]>(initialPincodes);

  // Delivery Rule Modal
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DeliveryRuleItem | null>(null);
  const [name, setName] = useState("");
  const [isDeliverable, setIsDeliverable] = useState(true);
  const [minOrderRupees, setMinOrderRupees] = useState("5000");
  const [freeShippingRupees, setFreeShippingRupees] = useState("");
  const [shippingMode, setShippingMode] = useState<ShippingMode>("CONFIRMED_OFFLINE");
  const [messageText, setMessageText] = useState("");
  const [priority, setPriority] = useState(0);
  const [selectedStateCodes, setSelectedStateCodes] = useState<string[]>([]);
  const [isSavingRule, setIsSavingRule] = useState(false);

  // New Restricted Pincode
  const [newPincode, setNewPincode] = useState("");
  const [newPincodeReason, setNewPincodeReason] = useState("");
  const [isAddingPincode, setIsAddingPincode] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/admin/delivery-rules");
      const json = await res.json();
      if (json.ok) setRules(json.data);
    } catch {}
  };

  const fetchPincodes = async () => {
    try {
      const res = await fetch("/api/admin/delivery-rules/pincodes");
      const json = await res.json();
      if (json.ok) setPincodes(json.data);
    } catch {}
  };

  const openCreateRule = () => {
    setEditingRule(null);
    setName("");
    setIsDeliverable(true);
    setMinOrderRupees("5000");
    setFreeShippingRupees("");
    setShippingMode("CONFIRMED_OFFLINE");
    setMessageText("Delivery charges confirmed via WhatsApp or payable at Sivakasi transport hub.");
    setPriority(10);
    setSelectedStateCodes([]);
    setIsRuleModalOpen(true);
  };

  const openEditRule = (r: DeliveryRuleItem) => {
    setEditingRule(r);
    setName(r.name);
    setIsDeliverable(r.isDeliverable);
    setMinOrderRupees(paiseToRupees(r.minOrderPaise).toString());
    setFreeShippingRupees(
      r.freeShippingThresholdPaise ? paiseToRupees(r.freeShippingThresholdPaise).toString() : ""
    );
    setShippingMode(r.shippingMode);
    setMessageText(r.messageText);
    setPriority(r.priority);
    setSelectedStateCodes(r.states.map((s) => s.code));
    setIsRuleModalOpen(true);
  };

  const handleToggleState = (code: string) => {
    if (selectedStateCodes.includes(code)) {
      setSelectedStateCodes(selectedStateCodes.filter((c) => c !== code));
    } else {
      setSelectedStateCodes([...selectedStateCodes, code]);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRule(true);

    const payload = {
      name,
      isDeliverable,
      minOrderPaise: rupeesToPaise(minOrderRupees),
      freeShippingThresholdPaise: freeShippingRupees ? rupeesToPaise(freeShippingRupees) : null,
      shippingMode,
      messageText,
      priority,
      stateCodes: selectedStateCodes,
    };

    try {
      const url = editingRule
        ? `/api/admin/delivery-rules/${editingRule.id}`
        : "/api/admin/delivery-rules";
      const method = editingRule ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.ok) {
        setFeedback(`Delivery rule "${name}" saved successfully!`);
        setTimeout(() => setFeedback(null), 3000);
        setIsRuleModalOpen(false);
        await fetchRules();
      } else {
        alert(json.message || "Failed to save delivery rule");
      }
    } catch {
      alert("Error saving delivery rule");
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleDeleteRule = async (id: string, ruleName: string) => {
    if (!confirm(`Delete delivery rule "${ruleName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/delivery-rules/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        await fetchRules();
      } else {
        alert(json.message || "Failed to delete delivery rule");
      }
    } catch {
      alert("Error deleting delivery rule");
    }
  };

  const handleAddPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPincode.trim() || !/^\d{6}$/.test(newPincode.trim())) {
      alert("Please enter a valid 6-digit postal pincode.");
      return;
    }

    setIsAddingPincode(true);
    try {
      const res = await fetch("/api/admin/delivery-rules/pincodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: newPincode.trim(), reason: newPincodeReason.trim() || undefined }),
      });
      const json = await res.json();
      if (json.ok) {
        setNewPincode("");
        setNewPincodeReason("");
        await fetchPincodes();
      } else {
        alert(json.message || "Failed to add restricted pincode");
      }
    } catch {
      alert("Error adding restricted pincode");
    } finally {
      setIsAddingPincode(false);
    }
  };

  const handleRemovePincode = async (pin: string) => {
    if (!confirm(`Remove restriction on pincode ${pin}?`)) return;
    try {
      await fetch(`/api/admin/delivery-rules/pincodes?pincode=${pin}`, { method: "DELETE" });
      await fetchPincodes();
    } catch {
      alert("Error removing restricted pincode");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-brand-gold" />
            Regional Delivery Rules & Restricted Pincodes
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Configure state minimum orders, freight policies, free shipping thresholds, and non-deliverable zones.
          </p>
        </div>

        {activeTab === "rules" && (
          <Button
            onClick={openCreateRule}
            className="bg-brand-primary text-white text-xs font-bold flex items-center gap-2 h-9"
          >
            <Plus className="w-4 h-4" />
            Create Delivery Rule
          </Button>
        )}
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {feedback}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("rules")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "rules" ? "bg-brand-primary text-white" : "bg-white/5 text-brand-muted hover:text-white"
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          State Delivery Rules ({rules.length})
        </button>

        <button
          onClick={() => setActiveTab("pincodes")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "pincodes" ? "bg-brand-primary text-white" : "bg-white/5 text-brand-muted hover:text-white"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Restricted Pincodes ({pincodes.length})
        </button>
      </div>

      {/* Tab 1: Rules Table */}
      {activeTab === "rules" && (
        <div className="bg-brand-bg-1/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-0/60 text-brand-muted uppercase text-[10px] font-bold tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-4">Rule Name</th>
                  <th className="p-4">States Covered</th>
                  <th className="p-4">Minimum Order</th>
                  <th className="p-4">Shipping Mode</th>
                  <th className="p-4">Free Shipping At</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="p-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        {r.name}
                        {r.isDefault && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                            Default
                          </span>
                        )}
                        {!r.isDeliverable && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400">
                            Blocked
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-brand-muted/80 mt-1 line-clamp-1">
                        {r.messageText}
                      </div>
                    </td>

                    <td className="p-4">
                      {r.isDefault ? (
                        <span className="text-brand-muted italic">All Unassigned States</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {r.states.map((st) => (
                            <span
                              key={st.code}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-white/90 border border-white/10"
                            >
                              {st.code}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="p-4 font-mono font-bold text-brand-gold text-sm">
                      {formatPaise(r.minOrderPaise)}
                    </td>

                    <td className="p-4">
                      <span className="text-[11px] text-white/90 font-mono">
                        {r.shippingMode.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-white/90">
                      {r.freeShippingThresholdPaise
                        ? formatPaise(r.freeShippingThresholdPaise)
                        : "—"}
                    </td>

                    <td className="p-4 font-mono text-brand-muted">{r.priority}</td>

                    <td className="p-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditRule(r)}
                        className="h-7 text-xs px-2.5"
                      >
                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      {!r.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRule(r.id, r.name)}
                          className="h-7 text-xs px-2.5 text-red-400 border-red-500/20 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Restricted Pincodes */}
      {activeTab === "pincodes" && (
        <div className="space-y-6">
          {/* Add Pincode Card */}
          <div className="bg-brand-bg-1/80 border border-white/10 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Add Non-Deliverable / Restricted Pincode
            </h3>
            <p className="text-xs text-brand-muted mb-4">
              Enquiries submitted with restricted pincodes are strictly blocked at checkout.
            </p>

            <form onSubmit={handleAddPincode} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                maxLength={6}
                placeholder="6-digit Pincode (e.g. 110001)"
                value={newPincode}
                onChange={(e) => setNewPincode(e.target.value)}
                className="w-full sm:w-48 bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-brand-primary"
              />

              <input
                type="text"
                placeholder="Reason (e.g. Local fireworks ban / No transporter coverage)"
                value={newPincodeReason}
                onChange={(e) => setNewPincodeReason(e.target.value)}
                className="flex-1 bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
              />

              <Button
                type="submit"
                disabled={isAddingPincode}
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold h-9 px-4 shrink-0"
              >
                Block Pincode
              </Button>
            </form>
          </div>

          {/* Pincodes List */}
          <div className="bg-brand-bg-1/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-bg-0/60 text-brand-muted uppercase text-[10px] font-bold border-b border-white/10">
                <tr>
                  <th className="p-4">Restricted Pincode</th>
                  <th className="p-4">Restriction Reason</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pincodes.map((pin) => (
                  <tr key={pin.pincode} className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono font-bold text-rose-400 text-sm">
                      {pin.pincode}
                    </td>
                    <td className="p-4 text-white/90">
                      {pin.reason || "Delivery restricted by operations"}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemovePincode(pin.pincode)}
                        className="h-7 text-xs px-2.5 text-brand-muted hover:text-white border-white/10"
                      >
                        Unblock
                      </Button>
                    </td>
                  </tr>
                ))}
                {pincodes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-brand-muted">
                      No pincodes are currently blocked.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-brand-bg-1 border border-white/20 rounded-2xl w-full max-w-2xl my-8 p-6 relative">
            <button
              onClick={() => setIsRuleModalOpen(false)}
              className="absolute top-4 right-4 text-brand-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2">
              {editingRule ? "Edit Delivery Rule" : "Create Regional Delivery Rule"}
            </h3>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-brand-muted uppercase mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tamil Nadu & Puducherry Special Express"
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-brand-muted uppercase mb-1">
                    Minimum Order (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={minOrderRupees}
                    onChange={(e) => setMinOrderRupees(e.target.value)}
                    className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-brand-muted uppercase mb-1">
                    Free Shipping Threshold (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={freeShippingRupees}
                    onChange={(e) => setFreeShippingRupees(e.target.value)}
                    placeholder="Leave blank if no free shipping"
                    className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-brand-muted uppercase mb-1">Shipping Mode</label>
                  <select
                    value={shippingMode}
                    onChange={(e) => setShippingMode(e.target.value as ShippingMode)}
                    className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="CONFIRMED_OFFLINE">Confirmed Offline (Hub Delivery)</option>
                    <option value="FREE_ELIGIBLE">Free Shipping Eligible</option>
                    <option value="RESTRICTED">Restricted / Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-brand-muted uppercase mb-1">
                    Priority (Higher wins)
                  </label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                    className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-brand-muted uppercase mb-1">
                  Customer Policy Wording *
                </label>
                <textarea
                  rows={2}
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl p-3 text-white resize-none"
                />
              </div>

              {/* State Selection */}
              <div>
                <label className="block font-bold text-brand-muted uppercase mb-2">
                  Assign Covered States ({selectedStateCodes.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto p-3 bg-brand-bg-0/60 rounded-xl border border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allStates.map((st) => {
                    const isChecked = selectedStateCodes.includes(st.code);
                    return (
                      <label
                        key={st.code}
                        className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer text-[11px] ${
                          isChecked ? "bg-brand-primary/20 text-white" : "text-brand-muted hover:text-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleState(st.code)}
                          className="w-3.5 h-3.5 rounded border-white/20 bg-brand-bg-1 text-brand-primary"
                        />
                        <span className="truncate">{st.name} ({st.code})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRuleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingRule}
                  className="bg-brand-primary text-white"
                >
                  {isSavingRule ? "Saving..." : "Save Delivery Rule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
