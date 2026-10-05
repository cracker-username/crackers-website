import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DEFAULT_SITE_CONFIG } from "@/lib/settings/siteConfig";

export const metadata = {
  title: `Admin Dashboard — ${DEFAULT_SITE_CONFIG.name}`,
  robots: { index: false, follow: false },
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-bg-0 flex flex-col lg:flex-row text-text">
      <AdminSidebar user={session.user} />
      <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
