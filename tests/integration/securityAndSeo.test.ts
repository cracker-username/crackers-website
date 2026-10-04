import { describe, it, expect, afterAll } from "vitest";
import { hashIp, checkRateLimit } from "@/lib/security/rateLimiter";
import { prisma } from "@/lib/db/prisma";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

describe("Phase 8: Security, Rate Limiting & SEO Integration Tests", () => {
  const testKey = `test_ratelimit_${Date.now()}`;

  afterAll(async () => {
    // Cleanup rate limit records created during testing
    await prisma.rateLimit.deleteMany({
      where: { key: { startsWith: "test_ratelimit_" } },
    });
  });

  describe("1. IP Privacy & Hashing", () => {
    it("anonymizes IP address into a 32-character SHA-256 hexadecimal hash", () => {
      const ip = "203.0.113.195";
      const hash1 = hashIp(ip);
      const hash2 = hashIp(ip);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(32);
      expect(hash1).not.toContain(ip); // Never exposes real IP
    });

    it("generates distinct hashes for distinct IP addresses", () => {
      const hashA = hashIp("198.51.100.1");
      const hashB = hashIp("198.51.100.2");

      expect(hashA).not.toBe(hashB);
    });

    it("handles null or undefined IP gracefully with anonymous fallback", () => {
      expect(hashIp(null)).toBe("anonymous");
      expect(hashIp(undefined)).toBe("anonymous");
      expect(hashIp("")).toBe("anonymous");
    });
  });

  describe("2. PostgreSQL-backed Rate Limiter", () => {
    it("permits requests under the configured threshold", async () => {
      const key = `${testKey}_under`;
      const res1 = await checkRateLimit({ key, limit: 3, windowSeconds: 60 });
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = await checkRateLimit({ key, limit: 3, windowSeconds: 60 });
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = await checkRateLimit({ key, limit: 3, windowSeconds: 60 });
      expect(res3.allowed).toBe(true);
      expect(res3.remaining).toBe(0);
    });

    it("strictly blocks requests exceeding the configured limit with 0 remaining", async () => {
      const key = `${testKey}_over`;
      // Exhaust limit of 2
      await checkRateLimit({ key, limit: 2, windowSeconds: 60 });
      await checkRateLimit({ key, limit: 2, windowSeconds: 60 });

      // 3rd attempt should be blocked
      const blocked = await checkRateLimit({ key, limit: 2, windowSeconds: 60 });
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.resetInSeconds).toBeGreaterThan(0);
    });

    it("persists count accurately in PostgreSQL RateLimit table", async () => {
      const key = `${testKey}_db`;
      await checkRateLimit({ key, limit: 5, windowSeconds: 60 });
      await checkRateLimit({ key, limit: 5, windowSeconds: 60 });

      const record = await prisma.rateLimit.findUnique({
        where: { key },
      });

      expect(record).not.toBeNull();
      expect(record?.count).toBe(2);
      expect(record?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("3. Dynamic Sitemap Generation", () => {
    it("generates a comprehensive sitemap with static and dynamic entries", async () => {
      const entries = await sitemap();

      expect(entries.length).toBeGreaterThan(0);

      const urls = entries.map((e) => e.url);

      // Verify essential static pages
      expect(urls.some((u) => u.endsWith("/"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/price-list"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/combos"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/safety"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/enquiry"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/faq"))).toBe(true);

      // Verify dynamic category & product collections
      expect(urls.some((u) => u.includes("/collections/"))).toBe(true);
      expect(urls.some((u) => u.includes("/products/"))).toBe(true);
    });

    it("strictly excludes administrative and API routes from sitemap", async () => {
      const entries = await sitemap();
      const urls = entries.map((e) => e.url);

      const hasAdmin = urls.some((u) => u.includes("/admin"));
      const hasApi = urls.some((u) => u.includes("/api"));

      expect(hasAdmin).toBe(false);
      expect(hasApi).toBe(false);
    });
  });

  describe("4. Robots Exclusion Standard", () => {
    it("allows public pages while strictly disallowing /admin/ and /api/", () => {
      const config = robots();

      expect(config.sitemap).toContain("/sitemap.xml");

      const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
      const defaultRule = rules.find((r) => r.userAgent === "*");

      expect(defaultRule).toBeDefined();
      expect(defaultRule?.allow).toBe("/");

      const disallowed = Array.isArray(defaultRule?.disallow)
        ? defaultRule?.disallow
        : [defaultRule?.disallow];

      expect(disallowed).toContain("/admin/");
      expect(disallowed).toContain("/api/");
    });
  });
});
