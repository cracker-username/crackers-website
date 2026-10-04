import { describe, it, expect } from "vitest";
import { calculateDiscountPercent, formatPaise } from "@/lib/utils/money";

describe("Catalogue & Pricing Display Logic", () => {
  it("calculates accurate discount percentages for product cards", () => {
    // 50% discount
    expect(calculateDiscountPercent(100000, 50000)).toBe(50);
    // 60% discount
    expect(calculateDiscountPercent(25000, 10000)).toBe(60);
    // 0% when price equals MRP
    expect(calculateDiscountPercent(50000, 50000)).toBe(0);
    // 0% when price exceeds MRP
    expect(calculateDiscountPercent(50000, 60000)).toBe(0);
  });

  it("formats prices consistently across card and table views", () => {
    expect(formatPaise(1600)).toBe("₹16");
    expect(formatPaise(2400)).toBe("₹24");
    expect(formatPaise(112000)).toBe("₹1,120");
    expect(formatPaise(420000)).toBe("₹4,200");
  });

  it("handles slug generation and formatting for collections and products", () => {
    const rawName = "4\" Deluxe Laxmi (Special Edition)";
    const slug = rawName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    expect(slug).toBe("4-deluxe-laxmi-special-edition");
  });
});
