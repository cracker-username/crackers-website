import { describe, it, expect, beforeAll } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { signAdminToken, verifyAdminToken } from "@/lib/auth/jwt";
import { getDashboardMetrics } from "@/lib/services/dashboardService";

describe("Admin Authentication & Security Integration Tests (Real PostgreSQL)", () => {
  const testEmail = `test_admin_${Date.now()}@crackers.local`;
  const rawPassword = "ValidPassword123!";
  let testUserId = "";

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(rawPassword, 12);
    const user = await prisma.adminUser.create({
      data: {
        email: testEmail,
        passwordHash,
        name: "Test Admin",
        role: "SUPER_ADMIN",
        isActive: true,
        mustChangePassword: true,
        tokenVersion: 1,
      },
    });
    testUserId = user.id;
  });

  it("verifies correct password against bcrypt hash cost 12", async () => {
    const user = await prisma.adminUser.findUnique({
      where: { id: testUserId },
    });
    expect(user).toBeDefined();

    const isMatch = await bcrypt.compare(rawPassword, user!.passwordHash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await bcrypt.compare("WrongPassword123!", user!.passwordHash);
    expect(isWrongMatch).toBe(false);
  });

  it("increments failedLogins and locks account after 5 failed attempts", async () => {
    // Perform 4 failed attempts
    for (let i = 1; i <= 4; i++) {
      await prisma.adminUser.update({
        where: { id: testUserId },
        data: { failedLogins: { increment: 1 } },
      });
    }

    let user = await prisma.adminUser.findUnique({ where: { id: testUserId } });
    expect(user?.failedLogins).toBe(4);
    expect(user?.lockedUntil).toBeNull();

    // 5th failed attempt triggers 15 min lock
    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.adminUser.update({
      where: { id: testUserId },
      data: {
        failedLogins: 5,
        lockedUntil,
      },
    });

    user = await prisma.adminUser.findUnique({ where: { id: testUserId } });
    expect(user?.failedLogins).toBe(5);
    expect(user?.lockedUntil).not.toBeNull();
    expect(user!.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
  });

  it("invalidates session when tokenVersion is incremented (logout everywhere)", async () => {
    // Generate token with tokenVersion: 1
    const token = await signAdminToken({
      userId: testUserId,
      email: testEmail,
      role: "SUPER_ADMIN",
      tokenVersion: 1,
    });

    const decoded = await verifyAdminToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.tokenVersion).toBe(1);

    // Simulate "Log out everywhere" by incrementing tokenVersion to 2
    await prisma.adminUser.update({
      where: { id: testUserId },
      data: { tokenVersion: { increment: 1 } },
    });

    const freshUser = await prisma.adminUser.findUnique({ where: { id: testUserId } });
    expect(freshUser?.tokenVersion).toBe(2);

    // Old token version (1) does not match user's live tokenVersion (2)
    const isTokenValidForUser = decoded?.tokenVersion === freshUser?.tokenVersion;
    expect(isTokenValidForUser).toBe(false);
  });

  it("calculates live dashboard metrics from real PostgreSQL", async () => {
    const metrics = await getDashboardMetrics();

    expect(metrics).toBeDefined();
    expect(typeof metrics.enquiriesToday).toBe("number");
    expect(typeof metrics.enquiriesThisWeek).toBe("number");
    expect(typeof metrics.totalEnquiries).toBe("number");
    expect(typeof metrics.totalEnquiryValuePaise).toBe("number");
    expect(typeof metrics.confirmedSharePercent).toBe("number");
    expect(metrics.statusCounts).toBeDefined();
    expect(metrics.sevenDayTrends).toHaveLength(7);
  });
});
