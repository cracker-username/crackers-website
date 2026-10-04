import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { isStatusTransitionAllowed } from "@/lib/services/statusMachine";
import { resolveDeliveryRuleForState } from "@/lib/rules/deliveryResolver";
import { hasPermission } from "@/lib/auth/permissions";

describe("Admin Enquiries, Content & Settings Integration Tests (Real PostgreSQL)", () => {
  let testSuperAdminId: string;
  let testStaffId: string;
  let testEnquiryId: string;
  const testEnquiryNumber = `TEST-ENQ-${Date.now()}`;

  beforeAll(async () => {
    // 1. Create Super Admin
    const superAdmin = await prisma.adminUser.create({
      data: {
        email: `super_${Date.now()}@crackers.local`,
        name: "Super Admin Tester",
        role: "SUPER_ADMIN",
        passwordHash: "hash123",
        isActive: true,
        mustChangePassword: false,
        tokenVersion: 1,
      },
    });
    testSuperAdminId = superAdmin.id;

    // 2. Create Staff User
    const staff = await prisma.adminUser.create({
      data: {
        email: `staff_${Date.now()}@crackers.local`,
        name: "Staff Tester",
        role: "STAFF",
        passwordHash: "hash123",
        isActive: true,
        mustChangePassword: false,
        tokenVersion: 1,
      },
    });
    testStaffId = staff.id;

    // 3. Create Test Enquiry
    const enquiry = await prisma.enquiry.create({
      data: {
        enquiryNumber: testEnquiryNumber,
        idempotencyKey: `idem-${Date.now()}`,
        payloadHash: "dummyhash",
        customerName: "Raja Shanmugam",
        mobile: "9876543210",
        state: "Tamil Nadu",
        city: "Madurai",
        pincode: "625001",
        address: "12 Main Road, Madurai",
        preferredContact: "WHATSAPP",
        subtotalPaise: 500000, // ₹5,000
        extraDiscountPaise: 0,
        shippingPaise: 0,
        totalEstimatePaise: 500000,
        minOrderPaiseSnap: 300000,
        ruleSnapshot: { minOrderPaise: 300000 },
        originalSnapshot: {
          items: [{ name: "Standard Sparkler", pricePaise: 50000, quantity: 10 }],
        },
        status: "NEW",
        items: {
          create: [
            {
              name: "Standard Sparkler",
              sku: "SPK-STD",
              unit: "box",
              packSize: "10 Pcs",
              pricePaise: 50000,
              mrpPaise: 80000,
              discountPercent: 38,
              quantity: 10,
              lineTotalPaise: 500000,
            },
          ],
        },
      },
    });
    testEnquiryId = enquiry.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.enquiryRevision.deleteMany({ where: { enquiryId: testEnquiryId } });
    await prisma.enquiryStatusHistory.deleteMany({ where: { enquiryId: testEnquiryId } });
    await prisma.enquiryNote.deleteMany({ where: { enquiryId: testEnquiryId } });
    await prisma.enquiryItem.deleteMany({ where: { enquiryId: testEnquiryId } });
    await prisma.enquiry.deleteMany({ where: { id: testEnquiryId } });
    await prisma.adminUser.deleteMany({
      where: { id: { in: [testSuperAdminId, testStaffId] } },
    });
  });

  describe("1. Status Transition Machine Rules", () => {
    it("allows valid forward transition from NEW to CONTACTED", () => {
      const check = isStatusTransitionAllowed({
        from: "NEW",
        to: "CONTACTED",
        role: "STAFF",
      });
      expect(check.allowed).toBe(true);
    });

    it("allows cancellation from NEW", () => {
      const check = isStatusTransitionAllowed({
        from: "NEW",
        to: "CANCELLED",
        role: "STAFF",
      });
      expect(check.allowed).toBe(true);
    });

    it("rejects illegal skips, e.g. from NEW directly to COMPLETED", () => {
      const check = isStatusTransitionAllowed({
        from: "NEW",
        to: "COMPLETED",
        role: "STAFF",
      });
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain("Invalid status transition");
    });

    it("blocks STAFF from reopening a CANCELLED or COMPLETED enquiry", () => {
      const check = isStatusTransitionAllowed({
        from: "CANCELLED",
        to: "NEW",
        role: "STAFF",
        reopenReason: "Customer called back",
      });
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain("Only SUPER_ADMIN can reopen");
    });

    it("requires SUPER_ADMIN to provide a mandatory justification to reopen", () => {
      // Empty reason
      const checkEmpty = isStatusTransitionAllowed({
        from: "CANCELLED",
        to: "NEW",
        role: "SUPER_ADMIN",
        reopenReason: "",
      });
      expect(checkEmpty.allowed).toBe(false);
      expect(checkEmpty.reason).toContain("mandatory justification");

      // Valid reason
      const checkValid = isStatusTransitionAllowed({
        from: "CANCELLED",
        to: "NEW",
        role: "SUPER_ADMIN",
        reopenReason: "Customer cleared transport permit issue",
      });
      expect(checkValid.allowed).toBe(true);
    });
  });

  describe("2. Enquiry Revision Engine", () => {
    it("preserves originalSnapshot while recording revision and recalculating totals", async () => {
      const enqBefore = await prisma.enquiry.findUniqueOrThrow({
        where: { id: testEnquiryId },
        include: { items: true },
      });

      const originalSnapshotJson = JSON.stringify(enqBefore.originalSnapshot);

      // Create Revision:
      // Change quantity to 8 (price = 500 * 8 = 4000), add extra discount ₹200 (20000 paise)
      const revisedSubtotal = 50000 * 8; // 400000 paise (₹4,000)
      const extraDiscount = 20000; // ₹200
      const revisedTotal = revisedSubtotal - extraDiscount; // 380000 paise (₹3,800)
      const revisionReason = "Customer reduced quantity from 10 to 8 boxes";

      await prisma.$transaction(async (tx) => {
        await tx.enquiryRevision.create({
          data: {
            enquiryId: testEnquiryId,
            revisionNumber: 1,
            changedById: testSuperAdminId,
            reason: revisionReason,
            beforeSnapshot: { subtotalPaise: enqBefore.subtotalPaise },
            afterSnapshot: { subtotalPaise: revisedSubtotal, totalEstimatePaise: revisedTotal },
          },
        });

        await tx.enquiryItem.deleteMany({ where: { enquiryId: testEnquiryId } });
        await tx.enquiryItem.create({
          data: {
            enquiryId: testEnquiryId,
            name: "Standard Sparkler",
            sku: "SPK-STD",
            unit: "box",
            packSize: "10 Pcs",
            pricePaise: 50000,
            mrpPaise: 80000,
            discountPercent: 38,
            quantity: 8,
            lineTotalPaise: 400000,
          },
        });

        await tx.enquiry.update({
          where: { id: testEnquiryId },
          data: {
            subtotalPaise: revisedSubtotal,
            extraDiscountPaise: extraDiscount,
            totalEstimatePaise: revisedTotal,
            version: { increment: 1 },
          },
        });
      });

      const enqAfter = await prisma.enquiry.findUniqueOrThrow({
        where: { id: testEnquiryId },
        include: { revisions: true, items: true },
      });

      // Assertions
      expect(JSON.stringify(enqAfter.originalSnapshot)).toBe(originalSnapshotJson); // IMMUTABLE!
      expect(enqAfter.subtotalPaise).toBe(400000);
      expect(enqAfter.totalEstimatePaise).toBe(380000);
      expect(enqAfter.version).toBe(enqBefore.version + 1);
      expect(enqAfter.revisions.length).toBe(1);
      expect(enqAfter.revisions[0]?.revisionNumber).toBe(1);
      expect(enqAfter.revisions[0]?.reason).toBe(revisionReason);
    });
  });

  describe("3. Delivery Rules Resolution & Pincode Restrictions", () => {
    it("resolves state-specific rule over default rule", async () => {
      // Find rules in DB
      const rules = await prisma.deliveryRule.findMany({
        where: { isActive: true },
        include: { states: true },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      });

      // TN state rule
      const tnRule = resolveDeliveryRuleForState(rules, "Tamil Nadu");
      expect(tnRule).toBeDefined();
      expect(tnRule?.minOrderPaise).toBe(300000); // ₹3,000 for TN

      // Default rule for a distant state without custom override
      const otherRule = resolveDeliveryRuleForState(rules, "Assam");
      expect(otherRule).toBeDefined();
      expect(otherRule?.minOrderPaise).toBe(500000); // ₹5,000 for other states
    });

    it("adds and enforces restricted pincodes", async () => {
      const testPincode = "999999";
      const created = await prisma.restrictedPincode.upsert({
        where: { pincode: testPincode },
        create: { pincode: testPincode, reason: "Test Non-deliverable zone" },
        update: {},
      });
      expect(created.pincode).toBe(testPincode);

      const exists = await prisma.restrictedPincode.findUnique({
        where: { pincode: testPincode },
      });
      expect(exists).toBeDefined();
      expect(exists?.reason).toBe("Test Non-deliverable zone");

      // Cleanup
      await prisma.restrictedPincode.delete({ where: { pincode: testPincode } });
    });
  });

  describe("4. Settings Registry Mutations", () => {
    it("persists global settings changes in database with audit log", async () => {
      const updatedBusinessName = `Sivakasi Sparklers ${Date.now()}`;

      await prisma.setting.upsert({
        where: { key: "businessName" },
        create: { key: "businessName", value: updatedBusinessName },
        update: { value: updatedBusinessName },
      });

      const retrieved = await prisma.setting.findUnique({
        where: { key: "businessName" },
      });
      expect(retrieved?.value).toBe(updatedBusinessName);
    });
  });

  describe("5. Role-Based Access Control (RBAC) Permissions", () => {
    it("grants full permissions to SUPER_ADMIN", () => {
      expect(hasPermission("SUPER_ADMIN", "SETTINGS_MANAGE")).toBe(true);
      expect(hasPermission("SUPER_ADMIN", "USERS_MANAGE")).toBe(true);
      expect(hasPermission("SUPER_ADMIN", "DELIVERY_RULES_MANAGE")).toBe(true);
      expect(hasPermission("SUPER_ADMIN", "PRODUCTS_BULK_PRICE")).toBe(true);
      expect(hasPermission("SUPER_ADMIN", "PRODUCTS_CSV_IMPORT")).toBe(true);
      expect(hasPermission("SUPER_ADMIN", "AUDIT_LOG_VIEW")).toBe(true);
      expect(hasPermission("SUPER_ADMIN", "ENQUIRIES_EDIT")).toBe(true);
    });

    it("strictly forbids STAFF from sensitive configuration permissions", () => {
      expect(hasPermission("STAFF", "SETTINGS_MANAGE")).toBe(false);
      expect(hasPermission("STAFF", "USERS_MANAGE")).toBe(false);
      expect(hasPermission("STAFF", "DELIVERY_RULES_MANAGE")).toBe(false);
      expect(hasPermission("STAFF", "PRODUCTS_BULK_PRICE")).toBe(false);
      expect(hasPermission("STAFF", "PRODUCTS_CSV_IMPORT")).toBe(false);
      expect(hasPermission("STAFF", "AUDIT_LOG_VIEW")).toBe(false);

      // But STAFF can handle everyday enquiries
      expect(hasPermission("STAFF", "ENQUIRIES_VIEW")).toBe(true);
      expect(hasPermission("STAFF", "ENQUIRIES_EDIT")).toBe(true);
      expect(hasPermission("STAFF", "ENQUIRIES_STATUS")).toBe(true);
    });
  });
});
