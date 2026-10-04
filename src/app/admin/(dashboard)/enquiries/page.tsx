import React from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { EnquiryTable } from "@/components/admin/EnquiryTable";

export const metadata: Metadata = {
  title: "Customer Enquiries — Admin Operations",
  robots: { index: false, follow: false },
};

export default async function AdminEnquiriesPage() {
  const [staff, states] = await Promise.all([
    prisma.adminUser.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.state.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <EnquiryTable staffList={staff} statesList={states} />
    </div>
  );
}
