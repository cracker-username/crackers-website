"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Settings,
  Building,
  Mail,
  Shield,
  Truck,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Loader2,
  Globe,
} from "lucide-react";

interface SettingsClientProps {
  initialSettings: Record<string, any>;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [settings, setSettings] = useState<Record<string, any>>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateField = (key: string, val: any) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const updateSocial = (network: string, val: string) => {
    setSettings((prev) => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks || {}),
        [network]: val,
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Failed to save settings");
      }

      setFeedback("Settings successfully saved and live caches invalidated.");
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    try {
      const res = await fetch("/api/admin/settings/test-smtp", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        alert(json.data.message);
      } else {
        alert(json.message || "Failed to trigger test notification.");
      }
    } catch {
      alert("Network error triggering notification test.");
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-5xl">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-gold" />
            Admin System & Business Settings
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Configure business identity, operational guardrails, regional shipping disclaimers, and SEO defaults.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSaving}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs h-10 px-5 flex items-center gap-2 shadow-lg shadow-brand-primary/20"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save All Settings
            </>
          )}
        </Button>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Section 1: Business Identity & Contact */}
      <div className="bg-brand-bg-1/80 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/5">
          <Building className="w-4 h-4 text-brand-accent-cyan" />
          Business Identity & Statutory Credentials
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-brand-muted mb-1">Business Name *</label>
            <input
              type="text"
              required
              value={settings.businessName || ""}
              onChange={(e) => updateField("businessName", e.target.value)}
              className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-brand-muted mb-1">Phone Number (Call) *</label>
            <input
              type="text"
              required
              value={settings.phone || ""}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-brand-muted mb-1">WhatsApp Order Desk *</label>
            <input
              type="text"
              required
              value={settings.whatsappNumber || ""}
              onChange={(e) => updateField("whatsappNumber", e.target.value)}
              placeholder="e.g. 919172600587 (with country code, no +)"
              className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-primary font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-brand-muted mb-1">Official Email Address *</label>
            <input
              type="email"
              required
              value={settings.email || ""}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-brand-muted mb-1">Fireworks Licence / PESO No.</label>
            <input
              type="text"
              value={settings.licenseNumber || ""}
              onChange={(e) => updateField("licenseNumber", e.target.value)}
              placeholder="e.g. E/SC/TN/20/1234 (Empty to hide badge)"
              className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-primary font-mono"
            />
            <span className="text-[10px] text-brand-muted/70 mt-1 block">
              Leave blank to completely hide licence badges across the public site.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-brand-muted mb-1">Operating Hours</label>
            <input
              type="text"
              value={settings.hours || ""}
              onChange={(e) => updateField("hours", e.target.value)}
              className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block font-semibold text-brand-muted mb-1">Sivakasi Warehouse Address</label>
            <input
              type="text"
              value={settings.address || ""}
              onChange={(e) => updateField("address", e.target.value)}
              className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Operational Guardrails & Controls */}
      <div className="bg-brand-bg-1/80 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/5">
          <Shield className="w-4 h-4 text-brand-gold" />
          Operations & Catalogue Guardrails
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-brand-bg-0/60 rounded-xl border border-white/5">
            <div>
              <span className="font-bold text-white block">Enquiries Open / Accepting Orders</span>
              <span className="text-[11px] text-brand-muted">
                If disabled, customer enquiry submission is paused with a notice.
              </span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(settings.enquiriesOpen)}
              onChange={(e) => updateField("enquiriesOpen", e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-brand-bg-1 text-brand-primary"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-brand-bg-0/60 rounded-xl border border-white/5">
            <div>
              <span className="font-bold text-white block">Enforce Minimum Order Rules</span>
              <span className="text-[11px] text-brand-muted">
                Blocks submission if cart total is below the state delivery rule.
              </span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(settings.enforceMinOrder)}
              onChange={(e) => updateField("enforceMinOrder", e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-brand-bg-1 text-brand-primary"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-brand-bg-0/60 rounded-xl border border-white/5">
            <div>
              <span className="font-bold text-white block">Show MRP & Discount Strikethrough</span>
              <span className="text-[11px] text-brand-muted">
                Displays strikethrough MRP and discount % tag alongside enquiry rate.
              </span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(settings.showMrpAndDiscount)}
              onChange={(e) => updateField("showMrpAndDiscount", e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-brand-bg-1 text-brand-primary"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-brand-bg-0/60 rounded-xl border border-white/5">
            <div>
              <span className="font-bold text-white block">Maintenance Mode</span>
              <span className="text-[11px] text-brand-muted">
                Renders a festival maintenance screen for public visitors.
              </span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(settings.maintenanceMode)}
              onChange={(e) => updateField("maintenanceMode", e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-brand-bg-1 text-brand-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-brand-muted mb-1">
              Enquiry Number Prefix (1-5 chars)
            </label>
            <input
              type="text"
              maxLength={5}
              value={settings.enquiryPrefix || "CE"}
              onChange={(e) => updateField("enquiryPrefix", e.target.value.toUpperCase())}
              className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-brand-primary"
            />
            <span className="text-[10px] text-brand-muted mt-1 block">
              Format: PREFIX-YY-XXXXXX (e.g. {settings.enquiryPrefix || "CE"}-26-000001)
            </span>
          </div>

          <div>
            <label className="block font-semibold text-brand-muted mb-1">Default Theme</label>
            <select
              value={settings.defaultTheme || "dark"}
              onChange={(e) => updateField("defaultTheme", e.target.value)}
              className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
            >
              <option value="dark">Festival Night Sky (Dark)</option>
              <option value="light">Diwali Daylight (Light Cream)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Shipping & Price Disclaimers */}
      <div className="bg-brand-bg-1/80 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/5">
          <Truck className="w-4 h-4 text-brand-accent-lime" />
          Shipping Wording & Legal Disclaimers
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-brand-muted mb-1">
              Regional Shipping / Freight Wording *
            </label>
            <textarea
              rows={2}
              required
              value={settings.shippingWording || ""}
              onChange={(e) => updateField("shippingWording", e.target.value)}
              className="w-full bg-brand-bg-0 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary resize-none leading-relaxed"
            />
            <span className="text-[10px] text-brand-muted mt-0.5 block">
              Displayed during checkout / enquiry review. Never claims free shipping unless explicitly enabled in the active delivery rule.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-brand-muted mb-1">
              Price & Tax Disclaimer Notice *
            </label>
            <textarea
              rows={2}
              required
              value={settings.priceAndGstNote || ""}
              onChange={(e) => updateField("priceAndGstNote", e.target.value)}
              className="w-full bg-brand-bg-0 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary resize-none leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Notifications & SMTP Testing */}
      <div className="bg-brand-bg-1/80 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/5">
          <Mail className="w-4 h-4 text-brand-primary" />
          Notifications & Email Alerts
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4 text-xs">
          <div className="flex-1">
            <label className="block font-semibold text-brand-muted mb-1">
              Operations Alert Email Recipient
            </label>
            <input
              type="email"
              value={settings.notificationEmail || ""}
              onChange={(e) => updateField("notificationEmail", e.target.value)}
              className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isTestingSmtp}
            onClick={handleTestSmtp}
            className="border-white/20 hover:border-white/40 text-xs h-9 px-4 flex items-center gap-2"
          >
            {isTestingSmtp ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Test Outbox / Notification
          </Button>
        </div>
      </div>

      {/* Section 5: SEO & Social Channels */}
      <div className="bg-brand-bg-1/80 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/5">
          <Globe className="w-4 h-4 text-brand-accent-violet" />
          Default SEO Metadata & Social Links
        </h2>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-brand-muted mb-1">Default Meta Title</label>
              <input
                type="text"
                value={settings.defaultSeoTitle || ""}
                onChange={(e) => updateField("defaultSeoTitle", e.target.value)}
                className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block font-semibold text-brand-muted mb-1">Default Meta Description</label>
              <input
                type="text"
                value={settings.defaultSeoDesc || ""}
                onChange={(e) => updateField("defaultSeoDesc", e.target.value)}
                className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block font-semibold text-brand-muted mb-1">Facebook URL</label>
              <input
                type="text"
                value={settings.socialLinks?.facebook || ""}
                onChange={(e) => updateSocial("facebook", e.target.value)}
                className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-brand-muted mb-1">Instagram URL</label>
              <input
                type="text"
                value={settings.socialLinks?.instagram || ""}
                onChange={(e) => updateSocial("instagram", e.target.value)}
                className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-brand-muted mb-1">YouTube URL</label>
              <input
                type="text"
                value={settings.socialLinks?.youtube || ""}
                onChange={(e) => updateSocial("youtube", e.target.value)}
                className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
