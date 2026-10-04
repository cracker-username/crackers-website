import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth, ADMIN_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  const result = await withAdminAuth(null, async (session) => {
    await prisma.adminUser.update({
      where: { id: session.user.id },
      data: {
        tokenVersion: { increment: 1 },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "LOGOUT_EVERYWHERE",
        entity: "AdminUser",
        entityId: session.user.id,
      },
    });

    return { message: "All sessions invalidated." };
  });

  const res = NextResponse.json(result, { status: result.ok ? 200 : 401 });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
