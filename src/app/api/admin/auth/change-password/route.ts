import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(10, "New password must be at least 10 characters long"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ChangePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message || "Invalid password parameters.",
      },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const result = await withAdminAuth(null, async (session) => {
    const user = await prisma.adminUser.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new Error("Current password is incorrect.");
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "PASSWORD_CHANGE",
        entity: "AdminUser",
        entityId: user.id,
      },
    });

    return { message: "Password updated successfully." };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
