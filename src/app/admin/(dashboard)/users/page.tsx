import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { UsersClient } from "@/components/admin/UsersClient";

export const metadata: Metadata = {
  title: "Staff Users — Admin Operations",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const users = await prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      failedLogins: true,
      lockedUntil: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <UsersClient initialUsers={users} currentUserId={session.user.id} />
    </div>
  );
}
