import { describe, it, expect } from "vitest";
import { signAdminToken, verifyAdminToken } from "@/lib/auth/jwt";
import { hasPermission } from "@/lib/auth/permissions";

describe("Admin Auth & Permissions Unit Tests", () => {
  it("signs and verifies admin JWT tokens correctly", async () => {
    const payload = {
      userId: "11111111-1111-1111-1111-111111111111",
      email: "admin@crackers.local",
      role: "SUPER_ADMIN" as const,
      tokenVersion: 1,
    };

    const token = await signAdminToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const verified = await verifyAdminToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.role).toBe(payload.role);
    expect(verified?.tokenVersion).toBe(1);
  });

  it("fails verification on tampered JWT tokens", async () => {
    const payload = {
      userId: "11111111-1111-1111-1111-111111111111",
      email: "staff@crackers.local",
      role: "STAFF" as const,
      tokenVersion: 1,
    };

    const token = await signAdminToken(payload);
    const tampered = token.slice(0, -6) + "xxxxxx";
    const verified = await verifyAdminToken(tampered);

    expect(verified).toBeNull();
  });

  it("enforces strict RBAC permission matrix for SUPER_ADMIN vs STAFF", () => {
    // SUPER_ADMIN has full permissions
    expect(hasPermission("SUPER_ADMIN", "SETTINGS_MANAGE")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "USERS_MANAGE")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "DELIVERY_RULES_MANAGE")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "PRODUCTS_BULK_PRICE")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "PRODUCTS_CSV_IMPORT")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "AUDIT_LOG_VIEW")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "ENQUIRIES_VIEW")).toBe(true);

    // STAFF has limited permissions and CANNOT access sensitive modules
    expect(hasPermission("STAFF", "ENQUIRIES_VIEW")).toBe(true);
    expect(hasPermission("STAFF", "PRODUCTS_VIEW")).toBe(true);
    expect(hasPermission("STAFF", "PRODUCTS_EDIT_BASIC")).toBe(true);

    // Blocked for STAFF
    expect(hasPermission("STAFF", "SETTINGS_MANAGE")).toBe(false);
    expect(hasPermission("STAFF", "USERS_MANAGE")).toBe(false);
    expect(hasPermission("STAFF", "DELIVERY_RULES_MANAGE")).toBe(false);
    expect(hasPermission("STAFF", "PRODUCTS_BULK_PRICE")).toBe(false);
    expect(hasPermission("STAFF", "PRODUCTS_CSV_IMPORT")).toBe(false);
    expect(hasPermission("STAFF", "AUDIT_LOG_VIEW")).toBe(false);
  });
});
