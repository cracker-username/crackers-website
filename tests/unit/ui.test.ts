import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/store/useCartStore";

describe("Cart Store Zustand Logic", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it("adds items and increments quantities correctly", () => {
    const item = {
      id: "prod-1",
      name: "Standard Sparkler",
      sku: "SP-01",
      packSize: "1 Box",
      unit: "Box",
      pricePaise: 3200, // ₹32
      mrpPaise: 8000,
      isCombo: false,
    };

    useCartStore.getState().addItem(item, 2);
    expect(useCartStore.getState().getTotalItems()).toBe(2);
    expect(useCartStore.getState().getSubtotalPaise()).toBe(6400);

    // Adding same item increments quantity
    useCartStore.getState().addItem(item, 3);
    expect(useCartStore.getState().getTotalItems()).toBe(5);
    expect(useCartStore.getState().getSubtotalPaise()).toBe(16000);
  });

  it("updates quantities and removes item on 0 quantity", () => {
    const item = {
      id: "prod-2",
      name: "Flower Pot",
      sku: "FP-01",
      packSize: "1 Box",
      unit: "Box",
      pricePaise: 5600, // ₹56
      mrpPaise: 14000,
      isCombo: false,
    };

    useCartStore.getState().addItem(item, 4);
    useCartStore.getState().updateQuantity("prod-2", 2);
    expect(useCartStore.getState().getTotalItems()).toBe(2);

    useCartStore.getState().updateQuantity("prod-2", 0);
    expect(useCartStore.getState().getTotalItems()).toBe(0);
    expect(useCartStore.getState().items.length).toBe(0);
  });

  it("supports state selection and persists across calls", () => {
    useCartStore.getState().setSelectedState("Karnataka");
    expect(useCartStore.getState().selectedState).toBe("Karnataka");
  });
});
