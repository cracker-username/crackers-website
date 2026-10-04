import { describe, it, expect } from "vitest";
import { formatPaise, rupeesToPaise, paiseToRupees, calculateDiscountPercent } from "@/lib/utils/money";
import { resolveDeliveryRuleForState, DeliveryRuleWithStates } from "@/lib/rules/deliveryResolver";
import { evaluateEnquiry } from "@/lib/rules/enquiryRules";

describe("Money Utilities", () => {
  it("formats paise into Indian Rupee strings accurately", () => {
    expect(formatPaise(50000)).toBe("₹500");
    expect(formatPaise(300000)).toBe("₹3,000");
    expect(formatPaise(125050)).toBe("₹1,250.50");
    expect(formatPaise(0)).toBe("₹0");
  });

  it("converts rupees to integer paise and vice versa", () => {
    expect(rupeesToPaise(500)).toBe(50000);
    expect(rupeesToPaise("350.75")).toBe(35075);
    expect(paiseToRupees(50000)).toBe(500);
    expect(paiseToRupees(35075)).toBe(350.75);
  });

  it("calculates discount percentages correctly", () => {
    expect(calculateDiscountPercent(100000, 70000)).toBe(30);
    expect(calculateDiscountPercent(50000, 50000)).toBe(0);
    expect(calculateDiscountPercent(0, 100)).toBe(0);
  });
});

describe("Delivery Rule Resolver", () => {
  const dummyStateTN = { id: "1", code: "TN", name: "Tamil Nadu", isUnionTerr: false, isActive: true };

  const rules: DeliveryRuleWithStates[] = [
    {
      id: "r-default",
      name: "All Other States",
      isDefault: true,
      isDeliverable: true,
      minOrderPaise: 500000, // Rs 5,000
      shippingMode: "CONFIRMED_OFFLINE",
      freeShippingThresholdPaise: 1000000,
      messageText: "Default shipping confirmation",
      cutoffAt: null,
      priority: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      states: [],
    },
    {
      id: "r-tn",
      name: "Tamil Nadu Priority Delivery",
      isDefault: false,
      isDeliverable: true,
      minOrderPaise: 300000, // Rs 3,000
      shippingMode: "FREE_ABOVE_THRESHOLD",
      freeShippingThresholdPaise: 700000,
      messageText: "Tamil Nadu fast transport",
      cutoffAt: null,
      priority: 10,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      states: [dummyStateTN],
    },
  ];

  it("state-specific rule beats the default rule", () => {
    const resolved = resolveDeliveryRuleForState(rules, "Tamil Nadu");
    expect(resolved.ruleName).toBe("Tamil Nadu Priority Delivery");
    expect(resolved.minOrderPaise).toBe(300000);
  });

  it("falls back to default rule when no state-specific rule exists", () => {
    const resolved = resolveDeliveryRuleForState(rules, "Kerala");
    expect(resolved.ruleName).toBe("All Other States");
    expect(resolved.minOrderPaise).toBe(500000);
  });
});

describe("Enquiry Rule Evaluator", () => {
  const mockRule = {
    isDeliverable: true,
    minOrderPaise: 300000, // Rs 3,000
    shippingMode: "FREE_ABOVE_THRESHOLD" as const,
    freeShippingThresholdPaise: 600000, // Rs 6,000
    messageText: "Standard transport",
    cutoffPassed: false,
    ruleName: "Tamil Nadu",
  };

  it("correctly identifies below minimum order and shortfall", () => {
    const items = [
      {
        id: "p1",
        name: "Sparklers",
        sku: "SP-01",
        pricePaise: 100000, // Rs 1,000
        mrpPaise: 150000,
        quantity: 2, // Total = Rs 2,000
        availability: "IN_STOCK" as const,
      },
    ];

    const result = evaluateEnquiry({ items, resolvedRule: mockRule });
    expect(result.subtotalPaise).toBe(200000);
    expect(result.isMinimumMet).toBe(false);
    expect(result.shortfallPaise).toBe(100000); // Rs 1,000 shortfall
    expect(result.isEligible).toBe(false);
  });

  it("unlocks eligibility and free shipping when thresholds are reached", () => {
    const items = [
      {
        id: "p1",
        name: "Flower Pots",
        sku: "FP-01",
        pricePaise: 200000,
        mrpPaise: 300000,
        quantity: 4, // Total = Rs 8,000
        availability: "IN_STOCK" as const,
      },
    ];

    const result = evaluateEnquiry({ items, resolvedRule: mockRule });
    expect(result.subtotalPaise).toBe(800000);
    expect(result.isMinimumMet).toBe(true);
    expect(result.isFreeShippingUnlocked).toBe(true);
    expect(result.isEligible).toBe(true);
  });

  it("blocks submission if any item is out of stock", () => {
    const items = [
      {
        id: "p1",
        name: "Out of Stock Rockets",
        sku: "RK-01",
        pricePaise: 500000,
        mrpPaise: 700000,
        quantity: 1,
        availability: "OUT_OF_STOCK" as const,
      },
    ];

    const result = evaluateEnquiry({ items, resolvedRule: mockRule });
    expect(result.isEligible).toBe(false);
    expect(result.unavailableItems.length).toBe(1);
  });
});
