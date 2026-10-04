import React, { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin Sign In — Sivakasi Sparklers",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-bg-0 relative overflow-hidden">
      {/* Background festive glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent-magenta/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent-orange/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="text-muted text-sm">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
