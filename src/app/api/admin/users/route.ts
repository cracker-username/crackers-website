import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

const CreateUserSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(2).max(100),
  role: z.nativeEnum(Role).default("STAFF"),
  password: z.string().min(10, "Password must be at least 10 characters"),
});

export async function GET() {
  const result = await withAdminAuth("USERS_MANAGE", async () => {
    return await prisma.adminUser.findMany({
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
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid user data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, name, role, password } = parsed.data;

  const result = await withAdminAuth("USERS_MANAGE", async (session) => {
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      throw new Error(`A user with email ${email} already exists.`);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.adminUser.create({
      data: {
        email,
        name,
        role,
        passwordHash,
        isActive: true,
        mustChangePassword: true,
        tokenVersion: 1,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "USER_CREATE",
        entity: "AdminUser",
        entityId: user.id,
        afterData: { email: user.email, name: user.name, role: user.role },
      },
    });

    return user;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
