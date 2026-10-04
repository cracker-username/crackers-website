import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AuditClient } from "@/components/admin/AuditClient";

export const metadata: Metadata = {
  title: "Audit Log & Operations Trail — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminAuditPage() {
  const session = await getAdminSession();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const [logs, actors] = await Promise.all([
    prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.adminUser.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AuditClient
        initialLogs={logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }))}
        actors={actors}
      />
    </div>
  );
}
