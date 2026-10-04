import React from "react";
import type { Metadata } from "next";
import { EnquiryForm } from "@/components/public/EnquiryForm";

export const metadata: Metadata = {
  title: "Review Enquiry & Estimate — Sivakasi Sparklers",
  description: "Review your selected festival fireworks, check minimum order requirements, and submit your direct factory enquiry.",
};

export default function EnquiryPage() {
  return (
    <main className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 mb-4">
        <h1 className="text-3xl font-extrabold font-heading text-text tracking-tight">
          Review Enquiry
        </h1>
        <p className="text-sm text-muted mt-1">
          Review your festive crackers selection and submit your location details for an authentic Sivakasi factory estimate.
        </p>
      </div>

      <EnquiryForm />
    </main>
  );
}
