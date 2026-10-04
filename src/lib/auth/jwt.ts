import { SignJWT, jwtVerify } from "jose";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "crackers-admin-jwt-secret-key-production-2026";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface AdminJwtPayload {
  userId: string;
  email: string;
  role: Role;
  tokenVersion: number;
}

/**
 * Sign an admin JWT session token with an 8-hour lifetime.
 */
export async function signAdminToken(payload: AdminJwtPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey);
}

/**
 * Verify and decode an admin JWT session token.
 */
export async function verifyAdminToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.userId === "string" &&
      typeof payload.email === "string" &&
      typeof payload.role === "string" &&
      typeof payload.tokenVersion === "number"
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role as Role,
        tokenVersion: payload.tokenVersion,
      };
    }

    return null;
  } catch {
    return null;
  }
}
