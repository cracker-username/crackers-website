import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { DeliveryRulesClient } from "@/components/admin/DeliveryRulesClient";

export const metadata: Metadata = {
  title: "Delivery Rules & Pincodes — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminDeliveryRulesPage() {
  const session = await getAdminSession();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const [rules, states, pincodes] = await Promise.all([
    prisma.deliveryRule.findMany({
      include: {
        states: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    }),
    prisma.state.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.restrictedPincode.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <DeliveryRulesClient
        initialRules={rules}
        allStates={states}
        initialPincodes={pincodes.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))}
      />
    </div>
  );
}
