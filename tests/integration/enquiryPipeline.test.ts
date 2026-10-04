import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { submitEnquiryPipeline } from "@/lib/services/enquiryService";
import { processOutboxBatch } from "@/lib/services/outboxService";

describe("Enquiry Engine Integration Tests (Real PostgreSQL)", () => {
  it("detects PRICE_CHANGED when client provided price diverges from DB", async () => {
    // 1. Fetch an active product
    const product = await prisma.product.findFirst({
      where: { isActive: true, isArchived: false, availability: "IN_STOCK" },
    });
    expect(product).toBeDefined();

    const idempotencyKey = `test_price_change_${Date.now()}`;
    const payload = {
      fullName: "Test Customer",
      mobile: "9876543210",
      state: "Tamil Nadu",
      city: "Madurai",
      pincode: "625001",
      address: "123 Bazaar Street",
      preferredContact: "WHATSAPP" as const,
      consent18Plus: true,
      items: [{ productId: product!.id, quantity: 20 }], // Quantity large enough to meet minimum
    };

    // Provide an outdated price (e.g. 100 paise less than actual)
    const clientProvidedPrices = {
      [product!.id]: product!.pricePaise - 100,
    };

    const result = await submitEnquiryPipeline({
      payload,
      idempotencyKey,
      clientProvidedPrices,
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("PRICE_CHANGED");
    expect(result.details).toBeDefined();

    // Verify no enquiry was inserted in DB
    const checkDb = await prisma.enquiry.findUnique({
      where: { idempotencyKey },
    });
    expect(checkDb).toBeNull();
  });

  it("detects BELOW_MINIMUM when subtotal is below state requirement", async () => {
    const product = await prisma.product.findFirst({
      where: { isActive: true, isArchived: false, availability: "IN_STOCK" },
    });
    expect(product).toBeDefined();

    const idempotencyKey = `test_below_min_${Date.now()}`;
    // Only 1 item, so price will be far below TN's ₹3,000 (300,000 paise) threshold
    const payload = {
      fullName: "Test Low Budget",
      mobile: "9876543210",
      state: "Tamil Nadu",
      city: "Chennai",
      pincode: "600001",
      address: "45 Anna Salai",
      preferredContact: "WHATSAPP" as const,
      consent18Plus: true,
      items: [{ productId: product!.id, quantity: 1 }],
    };

    const result = await submitEnquiryPipeline({
      payload,
      idempotencyKey,
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("BELOW_MINIMUM");
    expect(result.message).toContain("Tamil Nadu");

    // Verify nothing created in DB
    const checkDb = await prisma.enquiry.findUnique({
      where: { idempotencyKey },
    });
    expect(checkDb).toBeNull();
  });

  it("detects ITEM_UNAVAILABLE when an item does not exist or is unavailable", async () => {
    const idempotencyKey = `test_unavailable_${Date.now()}`;
    const payload = {
      fullName: "Test Customer",
      mobile: "9876543210",
      state: "Tamil Nadu",
      city: "Sivakasi",
      pincode: "626123",
      address: "Post Office Road",
      preferredContact: "CALL" as const,
      consent18Plus: true,
      items: [{ productId: "00000000-0000-0000-0000-000000000000", quantity: 50 }],
    };

    const result = await submitEnquiryPipeline({
      payload,
      idempotencyKey,
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("ITEM_UNAVAILABLE");
  });

  it("successfully creates an enquiry, increments counter, writes history and outbox event", async () => {
    // Pick products to exceed ₹3,000
    const products = await prisma.product.findMany({
      where: { isActive: true, isArchived: false, availability: "IN_STOCK" },
      take: 3,
    });
    expect(products.length).toBeGreaterThan(0);

    const idempotencyKey = `test_success_${Date.now()}`;
    const payload = {
      fullName: "Sundar Rajan",
      mobile: "9840123456",
      whatsapp: "9840123456",
      email: "sundar@example.com",
      state: "Tamil Nadu",
      city: "Coimbatore",
      pincode: "641001",
      address: "77 Cross Cut Road, Gandhipuram",
      preferredContact: "WHATSAPP" as const,
      notes: "Please call morning before delivery",
      consent18Plus: true,
      items: products.map((p) => ({ productId: p.id, quantity: 30 })),
    };

    const result = await submitEnquiryPipeline({
      payload,
      idempotencyKey,
    });

    expect(result.ok).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.enquiryNumber).toMatch(/^CE-\d{2}-\d{6}$/);

    const enqNum = result.data!.enquiryNumber;

    // Verify DB integrity
    const savedEnquiry = await prisma.enquiry.findUnique({
      where: { enquiryNumber: enqNum },
      include: {
        items: true,
        statusHistory: true,
      },
    });

    expect(savedEnquiry).toBeDefined();
    expect(savedEnquiry!.customerName).toBe("Sundar Rajan");
    expect(savedEnquiry!.items.length).toBe(products.length);
    expect(savedEnquiry!.status).toBe("NEW");
    expect(savedEnquiry!.statusHistory.length).toBe(1);
    expect(savedEnquiry!.statusHistory[0]!.visibleToCustomer).toBe(true);

    // Verify outbox event created
    const outboxEvent = await prisma.outboxEvent.findFirst({
      where: {
        payload: {
          path: ["enquiryNumber"],
          equals: enqNum,
        },
      },
    });
    expect(outboxEvent).toBeDefined();
    expect(outboxEvent!.type).toBe("NEW_ENQUIRY_ADMIN_EMAIL");
    expect(outboxEvent!.status).toBe("PENDING");
  });

  it("processes outbox events safely and marks them SENT", async () => {
    const processResult = await processOutboxBatch(10);
    expect(processResult).toBeDefined();
    expect(processResult.processedCount).toBeGreaterThanOrEqual(1);
    expect(processResult.deadCount).toBe(0);
  });
});
