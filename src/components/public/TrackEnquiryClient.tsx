"use client";

import React, { useState } from "react";
import {
  Search,
  CheckCircle2,
  Truck,
  AlertCircle,
  MessageCircle,
  Loader2,
  Calendar,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { formatPaise } from "@/lib/utils/money";
import { Button } from "../ui/Button";
import { DEFAULT_SITE_CONFIG } from "@/lib/settings/siteConfig";

interface TrackingResult {
  enquiryNumber: string;
  customerName: string;
  status: string;
  city: string;
  state: string;
  totalEstimatePaise: number;
  subtotalPaise: number;
  shippingPaise: number;
  createdAt: string;
  transportName?: string | null;
  lrNumber?: string | null;
  items: Array<{
    id: string;
    name: string;
    unit: string;
    packSize: string;
    quantity: number;
    pricePaise: number;
    lineTotalPaise: number;
  }>;
  timeline: Array<{
    status: string;
    message: string;
    timestamp: string;
  }>;
}

const STATUS_STEPS = [
  { key: "NEW", label: "Enquiry Received", desc: "Submitted to Sivakasi dispatch" },
  { key: "CONTACTED", label: "Staff Contacted", desc: "Stock verification & transport call" },
  { key: "QUOTE_SENT", label: "Estimate Finalized", desc: "Transport terms agreed" },
  { key: "CONFIRMED", label: "Confirmed", desc: "Order booked for packing" },
  { key: "READY", label: "Carton Packed", desc: "Packed with moisture protection" },
  { key: "DISPATCHED", label: "Dispatched", desc: "Handed to parcel transport" },
  { key: "COMPLETED", label: "Delivered", desc: "Received by customer" },
];

export function TrackEnquiryClient() {
  const [enquiryNumber, setEnquiryNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingResult | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTrackingData(null);

    const cleanNumber = enquiryNumber.trim().toUpperCase();
    const cleanMobile = mobile.trim();

    if (!cleanNumber) {
      setError("Please enter your Enquiry Number (e.g. CE-26-000001).");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError("Please enter the 10-digit mobile number used when submitting.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/enquiries/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiryNumber: cleanNumber,
          mobile: cleanMobile,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json.message || "No enquiry found matching this number and mobile.");
      } else {
        setTrackingData(json.data);
      }
    } catch (err) {
      console.error("Tracking request error:", err);
      setError("Network error while connecting to tracking service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    return STATUS_STEPS.findIndex((s) => s.key === status);
  };

  const currentStepIdx = trackingData ? getStepIndex(trackingData.status) : -1;
  const isCancelled = trackingData?.status === "CANCELLED";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Search Form Box */}
      <div className="bg-surface-1 border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleTrack} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Enquiry Reference Number
              </label>
              <input
                type="text"
                placeholder="e.g. CE-26-000001"
                value={enquiryNumber}
                onChange={(e) => setEnquiryNumber(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text font-mono uppercase focus:outline-none focus:border-accent-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Registered Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-muted font-medium">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9172600587"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-11 pr-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text focus:outline-none focus:border-accent-gold"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center text-sm py-2.5"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Checking Enquiry Status...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Track Enquiry
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Tracking Results */}
      {trackingData && (
        <div className="bg-surface-1 border border-border rounded-2xl p-6 sm:p-8 space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold font-heading text-text">
                  Enquiry {trackingData.enquiryNumber}
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isCancelled
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : "bg-accent-gold/20 text-accent-gold border border-accent-gold/30"
                  }`}
                >
                  {trackingData.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs text-muted mt-1">Customer: {trackingData.customerName}</p>
            </div>

            <div className="text-left sm:text-right space-y-0.5 text-xs text-muted">
              <div className="flex items-center sm:justify-end gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent-gold" />
                <span>
                  {new Date(trackingData.createdAt).toLocaleDateString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center sm:justify-end gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-accent-gold" />
                <span>
                  {trackingData.city}, {trackingData.state}
                </span>
              </div>
            </div>
          </div>

          {/* Cancelled Banner */}
          {isCancelled && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-300">Enquiry Cancelled</p>
                <p className="mt-0.5 text-red-200/90">
                  This enquiry was marked cancelled or closed. For assistance or re-booking, please contact our Sivakasi desk directly.
                </p>
              </div>
            </div>
          )}

          {/* Stepper (Only if not cancelled) */}
          {!isCancelled && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-muted tracking-wider">
                Progress Status
              </h4>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;

                  return (
                    <div key={step.key} className="relative flex items-start gap-4">
                      {/* Step Dot */}
                      <div
                        className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isDone
                            ? "bg-accent-gold border-accent-gold text-bg-0"
                            : "bg-surface-2 border-border text-transparent"
                        }`}
                      >
                        {isDone && <CheckCircle2 className="w-3 h-3 text-bg-0 stroke-[3]" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              isCurrent
                                ? "text-accent-gold font-bold"
                                : isDone
                                ? "text-text"
                                : "text-muted"
                            }`}
                          >
                            {step.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] bg-accent-gold/20 text-accent-gold px-2 py-0.5 rounded-full font-bold uppercase">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transport / Dispatched Details */}
          {(trackingData.transportName || trackingData.lrNumber) && (
            <div className="p-4 rounded-xl bg-surface-2 border border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-accent-gold uppercase tracking-wider">
                <Truck className="w-4 h-4" />
                Parcel Transport Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {trackingData.transportName && (
                  <div>
                    <span className="text-muted">Carrier / Transporter:</span>{" "}
                    <span className="font-semibold text-text">{trackingData.transportName}</span>
                  </div>
                )}
                {trackingData.lrNumber && (
                  <div>
                    <span className="text-muted">LR / Bilty Docket No:</span>{" "}
                    <span className="font-mono font-bold text-text">{trackingData.lrNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Timeline Log */}
          {trackingData.timeline && trackingData.timeline.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <h4 className="text-xs font-bold uppercase text-muted tracking-wider">
                Status History Updates
              </h4>
              <div className="space-y-2">
                {trackingData.timeline.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-surface-2/60 border border-border/50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                  >
                    <div>
                      <span className="font-semibold text-text">{entry.message}</span>
                    </div>
                    <span className="text-[11px] text-muted">
                      {new Date(entry.timestamp).toLocaleDateString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items Summary */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted">Enquiry Items:</span>
              <span className="font-medium text-text">{trackingData.items.length} Product Lines</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-text">Total Estimate Value:</span>
              <span className="font-price text-accent-gold text-base">
                {formatPaise(trackingData.totalEstimatePaise)}
              </span>
            </div>
          </div>

          {/* Support CTA */}
          <div className="pt-4 border-t border-border flex justify-between items-center">
            <span className="text-xs text-muted">Need fast help with this enquiry?</span>
            <a
              href={DEFAULT_SITE_CONFIG.whatsappDeepLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <MessageCircle className="w-3.5 h-3.5 text-green-400" />
                WhatsApp Helpdesk
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
