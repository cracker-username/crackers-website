import { describe, it, expect } from "vitest";
import { buildEnquiryNumber } from "@/lib/services/counterService";
import { buildWhatsAppLink } from "@/lib/services/whatsapp";
import { isStatusTransitionAllowed } from "@/lib/services/statusMachine";
import { validateCsvRows } from "@/lib/validation/csv";
import { getIstCurrentYearShort, calculateTimeRemaining } from "@/lib/utils/dates";

describe("Counter & Enquiry Number Format", () => {
  it("generates correct PREFIX-YY-XXXXXX format", () => {
    const num = buildEnquiryNumber("CE", 1, "26");
    expect(num).toBe("CE-26-000001");

    const custom = buildEnquiryNumber("SPARK", 42, "26");
    expect(custom).toBe("SPARK-26-000042");
  });

  it("extracts short IST year", () => {
    const yearShort = getIstCurrentYearShort();
    expect(yearShort.length).toBe(2);
    expect(Number(yearShort)).toBeGreaterThanOrEqual(24);
  });
});

describe("WhatsApp Link Builder & Truncation", () => {
  it("builds a clean wa.me link for small item lists", () => {
    const link = buildWhatsAppLink({
      businessName: "Test Sparklers",
      whatsappNumber: "919876543210",
      enquiryNumber: "CE-26-000001",
      customerName: "Ramesh Kumar",
      location: "Madurai, Tamil Nadu",
      items: [
        { name: "10cm Sparklers", quantity: 5 },
        { name: "Flower Pots Special", quantity: 2 },
      ],
      totalEstimatePaise: 450000,
    });

    expect(link.startsWith("https://wa.me/919876543210?text=")).toBe(true);
    expect(decodeURIComponent(link)).toContain("CE-26-000001");
    expect(decodeURIComponent(link)).toContain("Ramesh Kumar");
    expect(decodeURIComponent(link)).toContain("₹4,500");
    expect(link.length).toBeLessThan(1500);
  });

  it("truncates item list safely when enquiry has 100+ items to stay under 1,500 characters", () => {
    const manyItems = Array.from({ length: 100 }, (_, i) => ({
      name: `Multi-Shot Fancy Cake Item Long Name #${i + 1}`,
      quantity: i + 1,
    }));

    const link = buildWhatsAppLink({
      businessName: "Sivakasi Sparklers Direct",
      whatsappNumber: "+91-9876543210",
      enquiryNumber: "CE-26-000099",
      customerName: "Anand Sundaram",
      location: "Coimbatore, Tamil Nadu",
      items: manyItems,
      totalEstimatePaise: 8500000,
      summaryUrl: "https://crackers.local/enquiry/summary/CE-26-000099?token=xyz",
    });

    expect(link.length).toBeLessThanOrEqual(1500);
    expect(decodeURIComponent(link)).toContain("more items");
    expect(decodeURIComponent(link)).toContain("https://crackers.local/enquiry/summary/CE-26-000099");
  });
});

describe("Status Transition Machine", () => {
  it("allows standard forward transitions", () => {
    expect(
      isStatusTransitionAllowed({ from: "NEW", to: "CONTACTED", role: "STAFF" }).allowed
    ).toBe(true);

    expect(
      isStatusTransitionAllowed({ from: "CONTACTED", to: "QUOTE_SENT", role: "STAFF" }).allowed
    ).toBe(true);

    expect(
      isStatusTransitionAllowed({ from: "CONFIRMED", to: "READY", role: "STAFF" }).allowed
    ).toBe(true);

    expect(
      isStatusTransitionAllowed({ from: "READY", to: "DISPATCHED", role: "STAFF" }).allowed
    ).toBe(true);
  });

  it("rejects backwards or jumping invalid transitions", () => {
    expect(
      isStatusTransitionAllowed({ from: "CONFIRMED", to: "NEW", role: "STAFF" }).allowed
    ).toBe(false);

    expect(
      isStatusTransitionAllowed({ from: "NEW", to: "COMPLETED", role: "STAFF" }).allowed
    ).toBe(false);
  });

  it("allows cancellation from non-completed statuses", () => {
    expect(
      isStatusTransitionAllowed({ from: "AWAITING_CUSTOMER", to: "CANCELLED", role: "STAFF" }).allowed
    ).toBe(true);
  });

  it("requires SUPER_ADMIN and justification to reopen cancelled or completed", () => {
    // STAFF cannot reopen
    expect(
      isStatusTransitionAllowed({
        from: "CANCELLED",
        to: "NEW",
        role: "STAFF",
        reopenReason: "Customer changed mind",
      }).allowed
    ).toBe(false);

    // SUPER_ADMIN without reason cannot reopen
    expect(
      isStatusTransitionAllowed({
        from: "CANCELLED",
        to: "NEW",
        role: "SUPER_ADMIN",
        reopenReason: "",
      }).allowed
    ).toBe(false);

    // SUPER_ADMIN with valid reason can reopen
    expect(
      isStatusTransitionAllowed({
        from: "CANCELLED",
        to: "NEW",
        role: "SUPER_ADMIN",
        reopenReason: "Customer requested reopening via phone call",
      }).allowed
    ).toBe(true);
  });
});

describe("CSV Row Validator", () => {
  it("validates good product rows and converts rupees to paise", () => {
    const raw = [
      {
        sku: "SP-001",
        name: "Standard Sparklers",
        categoryName: "Sparklers",
        packSize: "1 Box (10 Pcs)",
        unit: "Box",
        mrpRupees: 100,
        priceRupees: 65,
        availability: "IN_STOCK",
      },
    ];

    const { validRows, errors } = validateCsvRows(raw);
    expect(errors.length).toBe(0);
    expect(validRows.length).toBe(1);
    expect(validRows[0]?.mrpPaise).toBe(10000);
    expect(validRows[0]?.pricePaise).toBe(6500);
  });

  it("detects invalid rows such as price > mrp or missing SKU", () => {
    const raw = [
      {
        sku: "BAD-01",
        name: "Overpriced Sparklers",
        categoryName: "Sparklers",
        packSize: "1 Box",
        unit: "Box",
        mrpRupees: 50,
        priceRupees: 80, // Price > MRP
        availability: "IN_STOCK",
      },
      {
        sku: "", // Missing SKU
        name: "No Sku Item",
        categoryName: "Pots",
        packSize: "1 Box",
        unit: "Box",
        mrpRupees: 100,
        priceRupees: 80,
        availability: "IN_STOCK",
      },
    ];

    const { validRows, errors } = validateCsvRows(raw);
    expect(validRows.length).toBe(0);
    expect(errors.length).toBe(2);
    expect(errors[0]?.message).toContain("Enquiry price cannot exceed MRP");
  });
});

describe("Date & Countdown Calculation", () => {
  it("calculates time remaining accurately", () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(); // 25 hours ahead
    const remaining = calculateTimeRemaining(futureDate);
    expect(remaining.isExpired).toBe(false);
    expect(remaining.days).toBe(1);
    expect(remaining.hours).toBe(1);
  });

  it("reports expired for past dates", () => {
    const pastDate = new Date(Date.now() - 10000).toISOString();
    const remaining = calculateTimeRemaining(pastDate);
    expect(remaining.isExpired).toBe(true);
    expect(remaining.totalMs).toBe(0);
  });
});
