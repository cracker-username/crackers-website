import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { signAdminToken } from "@/lib/auth/jwt";
import { ADMIN_COOKIE_NAME } from "@/lib/auth/session";
import { checkRateLimit, hashIp } from "@/lib/security/rateLimiter";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const ipHash = hashIp(ip);

    // 1. IP rate limiting (10 attempts per 15 mins)
    const rateLimit = await checkRateLimit({
      key: `admin_login_ip_${ipHash}`,
      limit: 10,
      windowSeconds: 900,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: "RATE_LIMITED",
          message: `Too many login attempts. Please wait ${Math.ceil(rateLimit.resetInSeconds / 60)} minutes before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, code: "INVALID_CREDENTIALS", message: "Invalid email or password." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // 2. Fetch user from database
    const user = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { ok: false, code: "INVALID_CREDENTIALS", message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 3. Check account lockout (5 failed attempts = 15 min lock)
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const waitMinutes = Math.max(1, Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000));
      return NextResponse.json(
        {
          ok: false,
          code: "ACCOUNT_LOCKED",
          message: `Account is locked due to multiple failed login attempts. Please try again after ${waitMinutes} minute${waitMinutes > 1 ? "s" : ""}.`,
        },
        { status: 423 }
      );
    }

    // 4. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      const newFailedCount = user.failedLogins + 1;
      const isNowLocked = newFailedCount >= 5;
      const lockedUntil = isNowLocked ? new Date(now.getTime() + 15 * 60 * 1000) : null;

      await prisma.adminUser.update({
        where: { id: user.id },
        data: {
          failedLogins: newFailedCount,
          lockedUntil,
        },
      });

      if (isNowLocked) {
        return NextResponse.json(
          {
            ok: false,
            code: "ACCOUNT_LOCKED",
            message: "Account locked for 15 minutes due to 5 consecutive failed login attempts.",
          },
          { status: 423 }
        );
      }

      return NextResponse.json(
        { ok: false, code: "INVALID_CREDENTIALS", message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 5. Successful login: reset failed counters & set lastLoginAt
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: now,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "LOGIN",
        entity: "AdminUser",
        entityId: user.id,
        ipAddress: ipHash,
      },
    });

    // 6. Sign JWT
    const token = await signAdminToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    // 7. Set Secure Cookie
    const isProd = process.env.NODE_ENV === "production";
    const res = NextResponse.json({
      ok: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
      },
    });

    res.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return res;
  } catch (err) {
    console.error("[POST /api/admin/auth/login] Error:", err);
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
