import { cookies } from "next/headers";
import { prisma } from "../db/prisma";
import { verifyAdminToken } from "./jwt";
import { Permission, hasPermission } from "./permissions";
import { Role } from "@prisma/client";

export interface AdminSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    mustChangePassword: boolean;
  };
}

export const ADMIN_COOKIE_NAME = "admin_session";

/**
 * Validates the current admin session from cookie, loading fresh user record from the database.
 * Deactivated users or invalidated tokenVersions immediately fail.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = await verifyAdminToken(token);
    if (!decoded) return null;

    // Fresh database lookup (no cache)
    const user = await prisma.adminUser.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        tokenVersion: true,
        mustChangePassword: true,
      },
    });

    if (!user || !user.isActive || user.tokenVersion !== decoded.tokenVersion) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  } catch (err) {
    console.error("[getAdminSession] Error verifying session:", err);
    return null;
  }
}

/**
 * Server-side guard wrapping route handlers and server actions with DB session verification
 * and strict RBAC permission checks.
 */
export async function withAdminAuth<T>(
  permission: Permission | null,
  handler: (session: AdminSession) => Promise<T>
): Promise<{ ok: true; data: T } | { ok: false; code: string; message: string }> {
  const session = await getAdminSession();

  if (!session) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Please sign in to access this admin action.",
    };
  }

  if (permission && !hasPermission(session.user.role, permission)) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: `You do not have permission (${permission}) to perform this action.`,
    };
  }

  try {
    const data = await handler(session);
    return { ok: true, data };
  } catch (err: unknown) {
    console.error("[withAdminAuth] Handler execution error:", err);
    const message = err instanceof Error ? err.message : "An unexpected server error occurred.";
    return {
      ok: false,
      code: "SERVER_ERROR",
      message,
    };
  }
}
