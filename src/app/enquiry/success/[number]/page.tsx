import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { verifyEnquiryToken } from "@/lib/utils/token";
import { formatPaise } from "@/lib/utils/money";
import { buildWhatsAppLink } from "@/lib/services/whatsapp";
import { parseSettingValue } from "@/lib/settings/registry";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2,
  MessageCircle,
  Phone,
  Printer,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  MapPin,
} from "lucide-react";

interface SuccessPageProps {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({
  params,
}: SuccessPageProps): Promise<Metadata> {
  const { number } = await params;
  return {
    title: `Enquiry ${number} Received — Sivakasi Sparklers`,
    robots: { index: false, follow: false },
  };
}

export default async function EnquirySuccessPage({
  params,
  searchParams,
}: SuccessPageProps) {
  const { number: enquiryNumber } = await params;
  const { token } = await searchParams;

  // 1. Verify access token to protect customer privacy
  const isAuthorized = verifyEnquiryToken(enquiryNumber, token);

  if (!isAuthorized) {
    return (
      <main className="min-h-screen py-16 px-4">
        <div className="max-w-md mx-auto text-center bg-surface-1 border border-border rounded-2xl p-8">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 mx-auto mb-4 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-heading mb-2">Access Token Expired or Missing</h2>
          <p className="text-xs text-muted mb-6">
            For customer privacy, direct success confirmations require a valid session token.
            If you submitted this enquiry, you can view your status using our enquiry tracker.
          </p>
          <Link href="/track-enquiry">
            <Button variant="primary" className="w-full justify-center">
              Track My Enquiry
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  // 2. Fetch enquiry details from database
  const enquiry = await prisma.enquiry.findUnique({
    where: { enquiryNumber },
    include: {
      items: true,
    },
  });

  if (!enquiry) {
    notFound();
  }

  // 3. Fetch business settings for WhatsApp and Phone CTAs
  const [bizNameSetting, bizPhoneSetting, whatsappSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "businessName" } }),
    prisma.setting.findUnique({ where: { key: "phone" } }),
    prisma.setting.findUnique({ where: { key: "whatsappNumber" } }),
  ]);

  const businessName = bizNameSetting ? (parseSettingValue("businessName", bizNameSetting.value) as string) : "Sivakasi Sparklers";
  const businessPhone = bizPhoneSetting ? (parseSettingValue("phone", bizPhoneSetting.value) as string) : "+919876543210";
  const whatsappNumber = whatsappSetting ? (parseSettingValue("whatsappNumber", whatsappSetting.value) as string) : "919876543210";

  // Build safe WhatsApp prefill link
  const summaryUrl = `https://crackers.local/enquiry/summary/${enquiryNumber}?token=${encodeURIComponent(token || "")}`;
  const whatsappUrl = buildWhatsAppLink({
    businessName,
    whatsappNumber,
    enquiryNumber: enquiry.enquiryNumber,
    customerName: enquiry.customerName,
    location: `${enquiry.city}, ${enquiry.state}`,
    items: enquiry.items.map((it) => ({ name: it.name, quantity: it.quantity })),
    totalEstimatePaise: enquiry.totalEstimatePaise,
    summaryUrl,
  });

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Success Header Box */}
        <div className="relative overflow-hidden rounded-2xl bg-surface-1 border border-border p-6 sm:p-8 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 rounded-full blur-3xl pointer-events-none" />

          {/* Green Confirmation Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-semibold mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            Enquiry Received Successfully
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-text mb-2">
            Thank you, {enquiry.customerName}!
          </h1>

          <div className="flex items-center justify-center gap-2 text-sm text-muted mb-6">
            <span>Enquiry Reference:</span>
            <span className="font-mono font-bold text-accent-gold bg-surface-2 px-3 py-1 rounded-md border border-border">
              {enquiry.enquiryNumber}
            </span>
          </div>

          {/* Mandatory Legal & Business Guardrail Notice */}
          <div className="p-4 sm:p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-left text-xs sm:text-sm space-y-2 mb-8">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              IMPORTANT: This is an Enquiry, NOT an Automated Order Confirmation
            </div>
            <p className="leading-relaxed text-amber-200/90">
              In compliance with Indian fireworks trade regulations, firecrackers are not sold via online payment.
              Our Sivakasi dispatch team has received your estimate request. We will verify current inventory and contact you via{" "}
              <strong>WhatsApp or phone</strong> to finalize delivery transporter logistics and booking.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-bold gap-2 px-6"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                Confirm on WhatsApp
              </Button>
            </a>

            <a href={`tel:${businessPhone}`} className="inline-flex">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 px-6"
              >
                <Phone className="w-4 h-4 text-accent-gold" />
                Call Sivakasi Office
              </Button>
            </a>

            <Link
              href={`/enquiry/summary/${enquiry.enquiryNumber}?token=${encodeURIComponent(token || "")}`}
            >
              <Button
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto gap-2 text-muted hover:text-text"
              >
                <Printer className="w-4 h-4" />
                Print Estimate
              </Button>
            </Link>
          </div>
        </div>

        {/* Enquiry Summary Card */}
        <div className="bg-surface-1 border border-border rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
            <div>
              <h3 className="font-bold text-lg font-heading text-text">Estimate Details</h3>
              <p className="text-xs text-muted">
                Submitted on {new Date(enquiry.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-4 h-4 text-accent-gold" />
              <span className="text-muted">{enquiry.city}, {enquiry.state} (PIN {enquiry.pincode})</span>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Selected Fireworks ({enquiry.items.length} Lines)
            </p>
            <div className="divide-y divide-border/50">
              {enquiry.items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-text">{item.name}</span>
                    <span className="text-muted ml-2">({item.packSize})</span>
                    <span className="text-muted ml-2">× {item.quantity}</span>
                  </div>
                  <span className="font-price font-bold text-text">
                    {formatPaise(item.lineTotalPaise)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial summary */}
          <div className="pt-4 border-t border-border flex justify-between items-center text-sm font-semibold">
            <span className="text-muted">Estimated Fireworks Total:</span>
            <span className="text-xl font-price font-bold text-accent-gold">
              {formatPaise(enquiry.totalEstimatePaise)}
            </span>
          </div>

          <p className="text-[11px] text-muted italic">
            * Transport and parcel freight charges will be informed by the seller based on your nearest transport hub.
          </p>
        </div>

        {/* Next Steps Guide */}
        <div className="p-6 rounded-xl bg-surface-1 border border-border space-y-4">
          <h4 className="font-bold text-sm text-text font-heading flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-gold" />
            What Happens Next?
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted">
            <div className="p-3 rounded-lg bg-surface-2 border border-border/60">
              <span className="font-bold text-text block mb-1">1. Stock Verification</span>
              Our Sivakasi warehouse verifies batch availability and fresh packing dates.
            </div>
            <div className="p-3 rounded-lg bg-surface-2 border border-border/60">
              <span className="font-bold text-text block mb-1">2. Direct Contact</span>
              Our coordinator contacts you on WhatsApp/Call with parcel transport options and estimate.
            </div>
            <div className="p-3 rounded-lg bg-surface-2 border border-border/60">
              <span className="font-bold text-text block mb-1">3. Secure Dispatch</span>
              Upon mutual agreement, your festive carton is booked through certified cargo services.
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center pt-4">
          <Link href="/price-list">
            <Button variant="outline" size="sm" className="gap-2">
              Return to Price List
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
