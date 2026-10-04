import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { SettingsSchemaMap, parseSettingValue } from "@/lib/settings/registry";
import { SettingsClient } from "@/components/admin/SettingsClient";

export const metadata: Metadata = {
  title: "Admin Settings — Operations",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const rows = await prisma.setting.findMany();
  const settingsMap: Record<string, any> = {};

  rows.forEach((r) => {
    settingsMap[r.key] = parseSettingValue(r.key as any, r.value);
  });

  Object.keys(SettingsSchemaMap).forEach((k) => {
    if (settingsMap[k] === undefined) {
      settingsMap[k] = parseSettingValue(k as any, undefined);
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <SettingsClient initialSettings={settingsMap} />
    </div>
  );
}
