import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { submitEnquiryPipeline } from "@/lib/services/enquiryService";
import crypto from "crypto";

describe("Database Concurrency & Idempotency Integration Tests", () => {
  let sampleProduct: any;

  beforeAll(async () => {
    // Ensure DB is connected and find a seeded product
    sampleProduct = await prisma.product.findFirst({
      where: { sku: "MS-01" }, // ₹260 enquiry price
    });
    if (!sampleProduct) {
      throw new Error("Seed product MS-01 not found. Ensure seed has run.");
    }
  });

  it("10 simultaneous submissions with SAME idempotency key produce exactly 1 enquiry and identical responses", async () => {
    const idempotencyKey = crypto.randomUUID();
    const payload = {
      fullName: "Anand R",
      mobile: "9876543210",
      whatsapp: "9876543210",
      state: "Tamil Nadu", // Min order ₹3,000
      city: "Madurai",
      pincode: "625001",
      address: "123 South Veli Street",
      preferredContact: "WHATSAPP" as const,
      consent18Plus: true,
      items: [
        {
          productId: sampleProduct.id,
          quantity: 15, // 15 * ₹260 = ₹3,900 (meets ₹3,000 minimum)
        },
      ],
    };

    // Trigger 10 concurrent requests simultaneously
    const requests = Array.from({ length: 10 }, () =>
      submitEnquiryPipeline({ payload, idempotencyKey })
    );

    const results = await Promise.all(requests);

    // All must succeed
    results.forEach((res) => {
      expect(res.ok).toBe(true);
      expect(res.data?.enquiryNumber).toBeDefined();
    });

    // All must return the identical enquiryNumber
    const enquiryNumbers = new Set(results.map((r) => r.data?.enquiryNumber));
    expect(enquiryNumbers.size).toBe(1);

    // Only 1 record in database for this key
    const countInDb = await prisma.enquiry.count({
      where: { idempotencyKey },
    });
    expect(countInDb).toBe(1);
  });

  it("same idempotency key with a DIFFERENT payload returns IDEMPOTENCY_MISMATCH", async () => {
    const idempotencyKey = crypto.randomUUID();
    const payload1 = {
      fullName: "Karthik Raja",
      mobile: "9842112345",
      state: "Tamil Nadu",
      city: "Chennai",
      pincode: "600001",
      address: "45 Mount Road",
      preferredContact: "CALL" as const,
      consent18Plus: true,
      items: [{ productId: sampleProduct.id, quantity: 15 }],
    };

    // First submission
    const res1 = await submitEnquiryPipeline({ payload: payload1, idempotencyKey });
    expect(res1.ok).toBe(true);

    // Second submission with altered customer name & address
    const payload2 = {
      ...payload1,
      fullName: "Different Person",
      address: "Altered Address 999",
    };

    const res2 = await submitEnquiryPipeline({ payload: payload2, idempotencyKey });
    expect(res2.ok).toBe(false);
    expect(res2.code).toBe("IDEMPOTENCY_MISMATCH");
  });

  it("returns PRICE_CHANGED when client price does not match fresh database price", async () => {
    const idempotencyKey = crypto.randomUUID();
    const payload = {
      fullName: "Senthil Kumar",
      mobile: "9443212345",
      state: "Tamil Nadu",
      city: "Salem",
      pincode: "636001",
      address: "88 Bazaar Street",
      preferredContact: "WHATSAPP" as const,
      consent18Plus: true,
      items: [{ productId: sampleProduct.id, quantity: 15 }],
    };

    // Pass old price in paise (e.g. 20000 instead of real 26000)
    const clientPrices = { [sampleProduct.id]: 20000 };

    const res = await submitEnquiryPipeline({
      payload,
      idempotencyKey,
      clientProvidedPrices: clientPrices,
    });

    expect(res.ok).toBe(false);
    expect(res.code).toBe("PRICE_CHANGED");

    // Must create nothing in the database
    const inDb = await prisma.enquiry.findUnique({ where: { idempotencyKey } });
    expect(inDb).toBeNull();
  });

  it("20 simultaneous enquiries with distinct keys produce 20 unique, gap-free sequence numbers", async () => {
    const count = 20;
    const basePayload = {
      fullName: "Concurrent Customer",
      mobile: "9894000000",
      state: "Tamil Nadu",
      city: "Trichy",
      pincode: "620001",
      address: "Gandhi Market",
      preferredContact: "WHATSAPP" as const,
      consent18Plus: true,
      items: [{ productId: sampleProduct.id, quantity: 15 }],
    };

    const promises = Array.from({ length: count }, (_, i) => {
      const uniqueKey = crypto.randomUUID();
      const payload = {
        ...basePayload,
        mobile: `989400${String(i).padStart(4, "0")}`,
      };
      return submitEnquiryPipeline({ payload, idempotencyKey: uniqueKey });
    });

    const results = await Promise.all(promises);

    results.forEach((r) => {
      expect(r.ok).toBe(true);
      expect(r.data?.enquiryNumber).toBeDefined();
    });

    const numbers = results.map((r) => r.data!.enquiryNumber);
    const uniqueNumbers = new Set(numbers);
    expect(uniqueNumbers.size).toBe(count);

    // Extract sequence integer suffixes to verify gap-free sequence
    const sequences = numbers
      .map((n) => parseInt(n.split("-")[2]!, 10))
      .sort((a, b) => a - b);

    for (let i = 1; i < sequences.length; i++) {
      expect(sequences[i]).toBe(sequences[i - 1]! + 1);
    }
  });

  it("optimistic locking on product: second concurrent update with stale version fails", async () => {
    const product = await prisma.product.create({
      data: {
        sku: "TEST-LOCK-" + Date.now(),
        name: "Test Lock Product",
        slug: "test-lock-" + Date.now(),
        categoryId: sampleProduct.categoryId,
        packSize: "1 Box",
        unit: "Box",
        mrpPaise: 10000,
        pricePaise: 5000,
        version: 1,
      },
    });

    // Admin 1 updates version from 1 to 2
    const update1 = await prisma.product.updateMany({
      where: { id: product.id, version: 1 },
      data: { pricePaise: 5500, version: { increment: 1 } },
    });
    expect(update1.count).toBe(1);

    // Admin 2 attempts update with old version 1 -> affected rows must be 0 (conflict detected)
    const update2 = await prisma.product.updateMany({
      where: { id: product.id, version: 1 },
      data: { pricePaise: 6000, version: { increment: 1 } },
    });
    expect(update2.count).toBe(0); // Version conflict prevented silent overwrite!
  });
});
