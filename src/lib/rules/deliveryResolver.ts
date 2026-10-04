import { DeliveryRule, State } from "@prisma/client";

export type DeliveryRuleWithStates = DeliveryRule & {
  states: State[];
};

export interface ResolvedDeliveryRule {
  isDeliverable: boolean;
  minOrderPaise: number;
  shippingMode: DeliveryRule["shippingMode"];
  freeShippingThresholdPaise: number | null;
  messageText: string;
  cutoffPassed: boolean;
  ruleName: string;
}

/**
 * Resolves the applicable delivery rule for a given state name or state code.
 * Resolution priority:
 * 1. Active rule explicitly linked to this state. If multiple, higher priority wins.
 * 2. Active default rule (isDefault = true). If multiple, higher priority wins.
 * 3. Fallback safe rule if no database rule configured.
 */
export function resolveDeliveryRuleForState(
  rules: DeliveryRuleWithStates[],
  stateIdentifier: string
): ResolvedDeliveryRule {
  const normState = stateIdentifier.trim().toLowerCase();

  // Find active rules explicitly matching this state
  const stateSpecificRules = rules.filter(
    (r) =>
      r.isActive &&
      r.states.some(
        (s) =>
          s.isActive &&
          (s.name.toLowerCase() === normState || s.code.toLowerCase() === normState)
      )
  );

  // Pick highest priority state-specific rule
  if (stateSpecificRules.length > 0) {
    const best = stateSpecificRules.sort((a, b) => b.priority - a.priority)[0]!;
    const cutoffPassed = best.cutoffAt ? Date.now() > new Date(best.cutoffAt).getTime() : false;
    return {
      isDeliverable: best.isDeliverable && !cutoffPassed,
      minOrderPaise: best.minOrderPaise,
      shippingMode: best.shippingMode,
      freeShippingThresholdPaise: best.freeShippingThresholdPaise,
      messageText: best.messageText,
      cutoffPassed,
      ruleName: best.name,
    };
  }

  // Find active default rules
  const defaultRules = rules.filter((r) => r.isActive && r.isDefault);
  if (defaultRules.length > 0) {
    const best = defaultRules.sort((a, b) => b.priority - a.priority)[0]!;
    const cutoffPassed = best.cutoffAt ? Date.now() > new Date(best.cutoffAt).getTime() : false;
    return {
      isDeliverable: best.isDeliverable && !cutoffPassed,
      minOrderPaise: best.minOrderPaise,
      shippingMode: best.shippingMode,
      freeShippingThresholdPaise: best.freeShippingThresholdPaise,
      messageText: best.messageText,
      cutoffPassed,
      ruleName: best.name,
    };
  }

  // Safe fallback if rules table is unseeded
  return {
    isDeliverable: true,
    minOrderPaise: 500000, // Rs 5,000 default
    shippingMode: "CONFIRMED_OFFLINE",
    freeShippingThresholdPaise: 1000000,
    messageText: "Transport & delivery details will be confirmed by phone/WhatsApp.",
    cutoffPassed: false,
    ruleName: "System Fallback",
  };
}
