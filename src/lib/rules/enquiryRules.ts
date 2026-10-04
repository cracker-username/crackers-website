import { StockStatus } from "@prisma/client";
import { ResolvedDeliveryRule } from "./deliveryResolver";

export interface ItemForCalculation {
  id: string;
  name: string;
  sku: string;
  pricePaise: number;
  mrpPaise: number;
  quantity: number;
  availability: StockStatus;
  isCombo?: boolean;
}

export interface CalculationResult {
  isEligible: boolean;
  subtotalPaise: number;
  minOrderPaise: number;
  shortfallPaise: number;
  isMinimumMet: boolean;
  shippingMode: ResolvedDeliveryRule["shippingMode"];
  shippingMessage: string;
  isFreeShippingUnlocked: boolean;
  unavailableItems: Array<{ id: string; name: string; status: StockStatus }>;
  reasons: string[];
}

/**
 * Single source of truth for computing enquiry totals, minimum order progress,
 * and location/product eligibility.
 */
export function evaluateEnquiry({
  items,
  resolvedRule,
  isPincodeRestricted,
  restrictedReason,
  enforceMinOrder = true,
}: {
  items: ItemForCalculation[];
  resolvedRule: ResolvedDeliveryRule;
  isPincodeRestricted?: boolean;
  restrictedReason?: string | null;
  enforceMinOrder?: boolean;
}): CalculationResult {
  const reasons: string[] = [];
  const unavailableItems: Array<{ id: string; name: string; status: StockStatus }> = [];

  let subtotalPaise = 0;

  for (const item of items) {
    if (item.availability === "OUT_OF_STOCK" || item.availability === "UNAVAILABLE") {
      unavailableItems.push({ id: item.id, name: item.name, status: item.availability });
    }
    subtotalPaise += item.pricePaise * item.quantity;
  }

  if (unavailableItems.length > 0) {
    reasons.push(
      `Some items are currently out of stock or unavailable: ${unavailableItems
        .map((i) => i.name)
        .join(", ")}`
    );
  }

  // Location checks
  if (isPincodeRestricted) {
    reasons.push(
      restrictedReason || "Deliveries are currently restricted in this PIN code area."
    );
  }

  if (!resolvedRule.isDeliverable) {
    reasons.push(
      resolvedRule.cutoffPassed
        ? "Seasonal enquiry bookings have closed for your state."
        : "Delivery is currently not available in this state."
    );
  }

  const minOrderPaise = resolvedRule.minOrderPaise;
  const isMinimumMet = !enforceMinOrder || subtotalPaise >= minOrderPaise;
  const shortfallPaise = Math.max(0, minOrderPaise - subtotalPaise);

  if (enforceMinOrder && !isMinimumMet) {
    reasons.push(
      `Minimum enquiry amount for your location is ₹${(minOrderPaise / 100).toLocaleString(
        "en-IN"
      )}. Add ₹${(shortfallPaise / 100).toLocaleString("en-IN")} more to proceed.`
    );
  }

  // Shipping message calculation
  let isFreeShippingUnlocked = false;
  let shippingMessage = resolvedRule.messageText;

  if (
    resolvedRule.shippingMode === "FREE_ABOVE_THRESHOLD" &&
    resolvedRule.freeShippingThresholdPaise
  ) {
    if (subtotalPaise >= resolvedRule.freeShippingThresholdPaise) {
      isFreeShippingUnlocked = true;
      shippingMessage = "Eligible for Free Transport to nearest hub!";
    } else {
      const remainingForFree = resolvedRule.freeShippingThresholdPaise - subtotalPaise;
      shippingMessage = `Add ₹${(remainingForFree / 100).toLocaleString(
        "en-IN"
      )} more to qualify for free hub delivery!`;
    }
  } else if (resolvedRule.shippingMode === "PICKUP_ONLY") {
    shippingMessage = "Direct pickup from Sivakasi warehouse only.";
  } else if (resolvedRule.shippingMode === "NOT_DELIVERABLE") {
    shippingMessage = "Deliveries not available to this region.";
  }

  const isEligible =
    unavailableItems.length === 0 &&
    !isPincodeRestricted &&
    resolvedRule.isDeliverable &&
    isMinimumMet &&
    items.length > 0;

  return {
    isEligible,
    subtotalPaise,
    minOrderPaise,
    shortfallPaise,
    isMinimumMet,
    shippingMode: resolvedRule.shippingMode,
    shippingMessage,
    isFreeShippingUnlocked,
    unavailableItems,
    reasons,
  };
}
