import React from "react";
import type { Metadata } from "next";
import { TrackEnquiryClient } from "@/components/public/TrackEnquiryClient";

export const metadata: Metadata = {
  title: "Track Enquiry Status — Sivakasi Sparklers",
  description: "Check the live dispatch status, carton packing progress, and parcel transport details of your festival enquiry.",
};

export default function TrackEnquiryPage() {
  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-text tracking-tight mb-2">
          Track Your Enquiry
        </h1>
        <p className="text-sm text-muted max-w-lg mx-auto">
          Enter your Enquiry Reference Number (e.g. CE-26-000001) and registered mobile number to check stock verification and dispatch updates.
        </p>
      </div>

      <TrackEnquiryClient />
    </main>
  );
}
