import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

const UpdateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
  resetPassword: z.string().min(10).optional(),
  unlockAccount: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid user update data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, role, isActive, resetPassword, unlockAccount } = parsed.data;

  const result = await withAdminAuth("USERS_MANAGE", async (session) => {
    const existing = await prisma.adminUser.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("User not found.");
    }

    // Protect against self-deactivation of current user
    if (existing.id === session.user.id && isActive === false) {
      throw new Error("You cannot deactivate your own active admin account.");
    }

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (role !== undefined) dataToUpdate.role = role;
    if (isActive !== undefined) dataToUpdate.isActive = isActive;

    if (resetPassword) {
      dataToUpdate.passwordHash = await bcrypt.hash(resetPassword, 12);
      dataToUpdate.mustChangePassword = true;
      dataToUpdate.tokenVersion = { increment: 1 }; // invalidate old sessions
    }

    if (unlockAccount) {
      dataToUpdate.lockedUntil = null;
      dataToUpdate.failedLogins = 0;
    }

    const updated = await prisma.adminUser.update({
      where: { id },
      data: dataToUpdate,
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
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "USER_UPDATE",
        entity: "AdminUser",
        entityId: id,
        afterData: {
          name: updated.name,
          role: updated.role,
          isActive: updated.isActive,
          passwordReset: Boolean(resetPassword),
          unlocked: Boolean(unlockAccount),
        },
      },
    });

    return updated;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
