import React from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { NotificationsClient } from "@/components/admin/NotificationsClient";

export const metadata: Metadata = {
  title: "Outbox & Notifications — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminNotificationsPage() {
  const [events, statusCounts] = await Promise.all([
    prisma.outboxEvent.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
    }),
    prisma.outboxEvent.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  let totalCount = 0;
  const stats: Record<string, number> = {};
  statusCounts.forEach((sc) => {
    stats[sc.status] = sc._count.status;
    totalCount += sc._count.status;
  });
  stats.TOTAL = totalCount;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <NotificationsClient
        initialEvents={events.map((e) => ({
          ...e,
          nextAttemptAt: e.nextAttemptAt.toISOString(),
          createdAt: e.createdAt.toISOString(),
          processedAt: e.processedAt ? e.processedAt.toISOString() : null,
        }))}
        initialStats={stats}
      />
    </div>
  );
}
