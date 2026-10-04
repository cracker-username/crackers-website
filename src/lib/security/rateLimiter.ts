import crypto from "crypto";
import { prisma } from "../db/prisma";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Hash an IP address using SHA-256 with a salt to respect privacy
 * while allowing reliable rate limiting per client.
 */
export function hashIp(ip: string | null | undefined): string {
  if (!ip) return "anonymous";
  const salt = process.env.JWT_SECRET || "rate-limit-salt-2026";
  return crypto.createHash("sha256").update(`${ip}:${salt}`).digest("hex").slice(0, 32);
}

/**
 * PostgreSQL-backed rate limiter using the RateLimit table.
 * Fully compatible with serverless runtimes.
 */
export async function checkRateLimit({
  key,
  limit,
  windowSeconds,
}: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const now = new Date();
  const windowMs = windowSeconds * 1000;

  try {
    const existing = await prisma.rateLimit.findUnique({
      where: { key },
    });

    if (!existing || existing.expiresAt <= now) {
      // Window expired or new key: reset/create
      const expiresAt = new Date(now.getTime() + windowMs);
      await prisma.rateLimit.upsert({
        where: { key },
        create: {
          key,
          windowStart: now,
          count: 1,
          expiresAt,
        },
        update: {
          windowStart: now,
          count: 1,
          expiresAt,
        },
      });

      return {
        allowed: true,
        remaining: limit - 1,
        resetInSeconds: windowSeconds,
      };
    }

    // Window still active
    const resetInSeconds = Math.max(0, Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000));

    if (existing.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds,
      };
    }

    // Increment count atomically
    const updated = await prisma.rateLimit.update({
      where: { key },
      data: {
        count: { increment: 1 },
      },
    });

    return {
      allowed: true,
      remaining: Math.max(0, limit - updated.count),
      resetInSeconds,
    };
  } catch (err) {
    console.error("[RateLimiter] Error updating rate limit:", err);
    // On unexpected database error during rate limiting, fail open safely
    return {
      allowed: true,
      remaining: 1,
      resetInSeconds: windowSeconds,
    };
  }
}
