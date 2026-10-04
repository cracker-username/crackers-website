import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { verifyEnquiryToken } from "@/lib/utils/token";
import { formatPaise } from "@/lib/utils/money";
import { parseSettingValue } from "@/lib/settings/registry";
import { PrintButton } from "@/components/public/PrintButton";
import { Button } from "@/components/ui/Button";
import { ShieldAlert, ArrowLeft } from "lucide-react";

interface SummaryPageProps {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({
  params,
}: SummaryPageProps): Promise<Metadata> {
  const { number } = await params;
  return {
    title: `Estimate Summary — ${number}`,
    robots: { index: false, follow: false },
  };
}

export default async function EnquirySummaryPage({
  params,
  searchParams,
}: SummaryPageProps) {
  const { number: enquiryNumber } = await params;
  const { token } = await searchParams;

  // Verify access token
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
            For customer privacy, direct enquiry estimates require a valid security token.
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

  const enquiry = await prisma.enquiry.findUnique({
    where: { enquiryNumber },
    include: { items: true },
  });

  if (!enquiry) {
    notFound();
  }

  // Load business settings for estimate header
  const [bizName, bizPhone, bizEmail, bizAddress, licenceNo] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "businessName" } }),
    prisma.setting.findUnique({ where: { key: "phone" } }),
    prisma.setting.findUnique({ where: { key: "email" } }),
    prisma.setting.findUnique({ where: { key: "address" } }),
    prisma.setting.findUnique({ where: { key: "licenseNumber" } }),
  ]);

  const businessName = (bizName ? parseSettingValue("businessName", bizName.value) : "Sivakasi Sparklers") as string;
  const businessPhone = (bizPhone ? parseSettingValue("phone", bizPhone.value) : "+919876543210") as string;
  const contactEmail = (bizEmail ? parseSettingValue("email", bizEmail.value) : "contact@crackers.local") as string;
  const businessAddress = (bizAddress
    ? parseSettingValue("address", bizAddress.value)
    : "Main Road, Sivakasi, Virudhunagar District, Tamil Nadu — 626123") as string;
  const licence = (licenceNo ? parseSettingValue("licenseNumber", licenceNo.value) : "") as string;

  const istDate = new Date(enquiry.createdAt).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen py-8 px-4 bg-background print:bg-white print:text-black">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Print Action Bar (Hidden during print) */}
        <div className="flex items-center justify-between gap-4 print:hidden">
          <Link href={`/enquiry/success/${enquiry.enquiryNumber}?token=${encodeURIComponent(token || "")}`}>
            <Button variant="ghost" size="sm" className="gap-2 text-muted hover:text-text">
              <ArrowLeft className="w-4 h-4" />
              Back to Confirmation
            </Button>
          </Link>
          <PrintButton />
        </div>

        {/* Estimate Document Sheet */}
        <div className="bg-surface-1 border border-border rounded-xl p-8 shadow-sm print:border-none print:shadow-none print:p-0 print:bg-white text-text print:text-black">
          {/* Header */}
          <div className="border-b-2 border-border pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black font-heading tracking-tight uppercase text-accent-gold print:text-black">
                {businessName}
              </h1>
              <p className="text-xs text-muted print:text-gray-600 mt-1 max-w-md">{businessAddress}</p>
              <div className="text-xs text-muted print:text-gray-600 mt-1 space-x-3">
                <span>Phone: {businessPhone}</span>
                <span>•</span>
                <span>Email: {contactEmail}</span>
              </div>
              {licence && (
                <p className="text-[11px] text-muted print:text-gray-500 mt-0.5">
                  Statutory Fireworks Licence No: {licence}
                </p>
              )}
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 rounded bg-accent-gold/10 text-accent-gold border border-accent-gold/30 text-xs font-bold uppercase tracking-wider print:border print:text-black">
                ENQUIRY / ESTIMATE
              </span>
              <p className="text-sm font-mono font-bold mt-2 text-text print:text-black">
                Ref: {enquiry.enquiryNumber}
              </p>
              <p className="text-xs text-muted print:text-gray-600 mt-0.5">Date: {istDate}</p>
            </div>
          </div>

          {/* Customer & Location Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-border text-xs">
            <div>
              <h3 className="font-bold text-muted print:text-gray-600 uppercase tracking-wider mb-2">
                Customer Details
              </h3>
              <p className="font-semibold text-text print:text-black text-sm">{enquiry.customerName}</p>
              <p className="text-muted print:text-gray-700 mt-0.5">Mobile: +91 {enquiry.mobile}</p>
              {enquiry.email && <p className="text-muted print:text-gray-700">Email: {enquiry.email}</p>}
              <p className="text-muted print:text-gray-700 mt-0.5">
                Preferred Contact: {enquiry.preferredContact === "WHATSAPP" ? "WhatsApp" : "Phone Call"}
              </p>
            </div>

            <div>
              <h3 className="font-bold text-muted print:text-gray-600 uppercase tracking-wider mb-2">
                Delivery Location
              </h3>
              <p className="text-text print:text-black leading-relaxed">{enquiry.address}</p>
              <p className="text-muted print:text-gray-700 mt-0.5">
                {enquiry.city}, {enquiry.state} — PIN {enquiry.pincode}
              </p>
              {enquiry.customerNotes && (
                <p className="text-muted print:text-gray-600 italic mt-2">
                  Special Notes: &ldquo;{enquiry.customerNotes}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="py-6 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border print:border-black text-muted print:text-black uppercase text-[11px]">
                  <th className="py-2.5 px-2 font-bold w-12">#</th>
                  <th className="py-2.5 px-2 font-bold">Item Description</th>
                  <th className="py-2.5 px-2 font-bold">Pack Size / Unit</th>
                  <th className="py-2.5 px-2 font-bold text-center w-16">Qty</th>
                  <th className="py-2.5 px-2 font-bold text-right w-24">Rate (₹)</th>
                  <th className="py-2.5 px-2 font-bold text-right w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 print:divide-gray-300">
                {enquiry.items.map((item, idx) => (
                  <tr key={item.id} className="text-text print:text-black">
                    <td className="py-2.5 px-2 text-muted print:text-gray-600">{idx + 1}</td>
                    <td className="py-2.5 px-2 font-medium">{item.name}</td>
                    <td className="py-2.5 px-2 text-muted print:text-gray-600">{item.packSize}</td>
                    <td className="py-2.5 px-2 text-center font-semibold">{item.quantity}</td>
                    <td className="py-2.5 px-2 text-right font-price">{formatPaise(item.pricePaise)}</td>
                    <td className="py-2.5 px-2 text-right font-price font-bold">
                      {formatPaise(item.lineTotalPaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation & Subtotal Box */}
          <div className="border-t border-border pt-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="text-xs text-muted print:text-gray-600 max-w-sm space-y-1">
              <p className="font-semibold text-text print:text-black">Parcel Transport Note:</p>
              <p>
                Estimated fireworks rate excludes parcel transport freight. Transporter cargo fee is payable
                at actuals upon booking or receipt at your district delivery hub.
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted print:text-gray-600">Items Subtotal:</span>
                <span className="font-price font-bold text-text print:text-black">
                  {formatPaise(enquiry.subtotalPaise)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted print:text-gray-600">Estimated Total:</span>
                <span className="font-price font-extrabold text-base text-accent-gold print:text-black">
                  {formatPaise(enquiry.totalEstimatePaise)}
                </span>
              </div>
            </div>
          </div>

          {/* Statutory Disclaimers */}
          <div className="mt-8 pt-6 border-t border-dashed border-border print:border-black text-[11px] text-muted print:text-gray-600 space-y-1">
            <p className="font-bold uppercase text-text print:text-black">
              Statutory Fireworks Trade &amp; Safety Disclaimer:
            </p>
            <p>
              1. This document is a formal price enquiry and quotation estimate, NOT an automated sales invoice or payment receipt.
            </p>
            <p>
              2. Sale and dispatch of green fireworks adhere strictly to Section 18 of the Explosives Act and regional statutory requirements.
            </p>
            <p>
              3. Fireworks must strictly be handled by adults aged 18 and above in open outdoor spaces with safety water buckets available.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
