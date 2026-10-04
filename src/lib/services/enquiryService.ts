import crypto from "crypto";
import { prisma } from "../db/prisma";
import { SubmitEnquiryPayload } from "../validation/enquiry";
import { resolveDeliveryRuleForState } from "../rules/deliveryResolver";
import { evaluateEnquiry } from "../rules/enquiryRules";
import { buildEnquiryNumber } from "./counterService";
import { getIstCurrentYearShort } from "../utils/dates";
import { parseSettingValue } from "../settings/registry";

export interface EnquirySubmissionResult {
  ok: boolean;
  code?: string;
  message?: string;
  details?: unknown;
  data?: {
    enquiryNumber: string;
    subtotalPaise: number;
    totalEstimatePaise: number;
    token?: string;
  };
}

/**
 * Normalise submission payload and compute SHA-256 hash
 */
export function hashPayload(payload: SubmitEnquiryPayload): string {
  const normalized = {
    fullName: payload.fullName.trim().toLowerCase(),
    mobile: payload.mobile.trim(),
    state: payload.state.trim().toLowerCase(),
    city: payload.city.trim().toLowerCase(),
    pincode: payload.pincode.trim(),
    items: payload.items
      .map((i) => ({
        id: i.productId || i.comboId,
        qty: i.quantity,
      }))
      .sort((a, b) => (a.id || "").localeCompare(b.id || "")),
  };
  return crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

/**
 * Execute transactional enquiry submission pipeline with strict idempotency
 */
export async function submitEnquiryPipeline({
  payload,
  idempotencyKey,
  clientProvidedPrices, // Map of { [id: string]: number } in paise for price change check
}: {
  payload: SubmitEnquiryPayload;
  idempotencyKey: string;
  clientProvidedPrices?: Record<string, number>;
}): Promise<EnquirySubmissionResult> {
  // 1. Honeypot check
  if (payload.honeypot && payload.honeypot.length > 0) {
    return { ok: false, code: "BOT_DETECTED", message: "Submission rejected." };
  }

  // 2. Compute Payload Hash
  const payloadHash = hashPayload(payload);

  // 3. Check for existing enquiry with same idempotency key
  const existing = await prisma.enquiry.findUnique({
    where: { idempotencyKey },
    include: { items: true },
  });

  if (existing) {
    if (existing.payloadHash !== payloadHash) {
      return {
        ok: false,
        code: "IDEMPOTENCY_MISMATCH",
        message: "This idempotency key was previously used with different enquiry details.",
      };
    }
    return {
      ok: true,
      data: {
        enquiryNumber: existing.enquiryNumber,
        subtotalPaise: existing.subtotalPaise,
        totalEstimatePaise: existing.totalEstimatePaise,
      },
    };
  }

  // 4. Fetch fresh product and combo data from database (no cache)
  const productIds = payload.items.filter((i) => i.productId).map((i) => i.productId!);
  const comboIds = payload.items.filter((i) => i.comboId).map((i) => i.comboId!);

  const [dbProducts, dbCombos, restrictedPin, rules, prefixSetting] = await Promise.all([
    productIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: productIds }, isArchived: false, isActive: true },
        })
      : [],
    comboIds.length > 0
      ? prisma.combo.findMany({
          where: { id: { in: comboIds }, isArchived: false, isActive: true },
          include: { items: { include: { product: true } } },
        })
      : [],
    prisma.restrictedPincode.findUnique({
      where: { pincode: payload.pincode },
    }),
    prisma.deliveryRule.findMany({
      include: { states: true },
    }),
    prisma.setting.findUnique({ where: { key: "enquiryPrefix" } }),
  ]);

  const prefix = prefixSetting ? parseSettingValue("enquiryPrefix", prefixSetting.value) : "CE";

  // Build items for calculation
  const itemsForCalc: any[] = [];
  const priceChanges: Array<{ id: string; name: string; oldPaise: number; newPaise: number }> = [];

  for (const item of payload.items) {
    if (item.productId) {
      const prod = dbProducts.find((p) => p.id === item.productId);
      if (!prod) {
        return {
          ok: false,
          code: "ITEM_UNAVAILABLE",
          message: "One or more selected products are no longer available in our catalogue.",
        };
      }
      if (clientProvidedPrices && clientProvidedPrices[prod.id] !== undefined) {
        const clientPrice = clientProvidedPrices[prod.id]!;
        if (clientPrice !== prod.pricePaise) {
          priceChanges.push({
            id: prod.id,
            name: prod.name,
            oldPaise: clientPrice,
            newPaise: prod.pricePaise,
          });
        }
      }
      itemsForCalc.push({
        id: prod.id,
        name: prod.name,
        sku: prod.sku,
        unit: prod.unit,
        packSize: prod.packSize,
        pricePaise: prod.pricePaise,
        mrpPaise: prod.mrpPaise,
        quantity: item.quantity,
        availability: prod.availability,
        isCombo: false,
      });
    } else if (item.comboId) {
      const combo = dbCombos.find((c) => c.id === item.comboId);
      if (!combo) {
        return {
          ok: false,
          code: "ITEM_UNAVAILABLE",
          message: "One or more selected combos are no longer available.",
        };
      }
      if (clientProvidedPrices && clientProvidedPrices[combo.id] !== undefined) {
        const clientPrice = clientProvidedPrices[combo.id]!;
        if (clientPrice !== combo.comboPaise) {
          priceChanges.push({
            id: combo.id,
            name: combo.name,
            oldPaise: clientPrice,
            newPaise: combo.comboPaise,
          });
        }
      }
      itemsForCalc.push({
        id: combo.id,
        name: combo.name,
        sku: combo.slug,
        unit: "Combo Pack",
        packSize: `${combo.items.length} Products`,
        pricePaise: combo.comboPaise,
        mrpPaise: combo.originalPaise,
        quantity: item.quantity,
        availability: combo.availability,
        isCombo: true,
        comboContents: combo.items.map((ci) => ({
          productId: ci.productId,
          productName: ci.product.name,
          quantity: ci.quantity,
        })),
      });
    }
  }

  // Detect price changes
  if (priceChanges.length > 0) {
    return {
      ok: false,
      code: "PRICE_CHANGED",
      message: "Some prices were updated. Please review your enquiry before submitting again.",
      details: priceChanges,
    };
  }

  // 5. Evaluate delivery rule and enquiry validity
  const resolvedRule = resolveDeliveryRuleForState(rules as any, payload.state);
  const evaluation = evaluateEnquiry({
    items: itemsForCalc,
    resolvedRule,
    isPincodeRestricted: !!restrictedPin,
    restrictedReason: restrictedPin?.reason,
  });

  if (!evaluation.isEligible) {
    if (evaluation.unavailableItems.length > 0) {
      return {
        ok: false,
        code: "ITEM_UNAVAILABLE",
        message: "Some items are currently out of stock or unavailable.",
        details: evaluation.unavailableItems,
      };
    }
    if (!evaluation.isMinimumMet) {
      return {
        ok: false,
        code: "BELOW_MINIMUM",
        message: `Your enquiry is below the minimum required amount for ${payload.state}.`,
        details: { shortfallPaise: evaluation.shortfallPaise, minOrderPaise: evaluation.minOrderPaise },
      };
    }
    return {
      ok: false,
      code: "LOCATION_RESTRICTED",
      message: evaluation.reasons.join(". "),
    };
  }

  // 6. Execute atomic database transaction
  const yearShort = getIstCurrentYearShort();
  const counterId = `ENQUIRY_${yearShort}`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Atomic counter increment
      const counter = await tx.counter.upsert({
        where: { id: counterId },
        update: { lastNumber: { increment: 1 } },
        create: { id: counterId, lastNumber: 1 },
      });

      const enquiryNumber = buildEnquiryNumber(prefix, counter.lastNumber, yearShort);

      const enquiry = await tx.enquiry.create({
        data: {
          enquiryNumber,
          idempotencyKey,
          payloadHash,
          customerName: payload.fullName.trim(),
          mobile: payload.mobile.trim(),
          whatsappNumber: payload.whatsapp ? payload.whatsapp.trim() : null,
          email: payload.email ? payload.email.trim() : null,
          state: payload.state.trim(),
          city: payload.city.trim(),
          pincode: payload.pincode.trim(),
          address: payload.address.trim(),
          preferredContact: payload.preferredContact,
          customerNotes: payload.notes ? payload.notes.trim() : null,
          consent18Plus: payload.consent18Plus,
          subtotalPaise: evaluation.subtotalPaise,
          extraDiscountPaise: 0,
          shippingPaise: 0,
          totalEstimatePaise: evaluation.subtotalPaise,
          minOrderPaiseSnap: evaluation.minOrderPaise,
          ruleSnapshot: JSON.parse(JSON.stringify(resolvedRule)),
          originalSnapshot: JSON.parse(
            JSON.stringify({
              payload,
              evaluation,
              submittedAt: new Date().toISOString(),
            })
          ),
          status: "NEW",
          items: {
            create: itemsForCalc.map((item) => ({
              productId: item.isCombo ? null : item.id,
              comboId: item.isCombo ? item.id : null,
              name: item.name,
              sku: item.sku,
              unit: item.unit,
              packSize: item.packSize,
              pricePaise: item.pricePaise,
              mrpPaise: item.mrpPaise,
              discountPercent: Math.round(((item.mrpPaise - item.pricePaise) / (item.mrpPaise || 1)) * 100),
              quantity: item.quantity,
              lineTotalPaise: item.pricePaise * item.quantity,
              comboContents: item.comboContents || null,
            })),
          },
          statusHistory: {
            create: {
              toStatus: "NEW",
              comment: "Enquiry submitted by customer online",
              visibleToCustomer: true,
            },
          },
          revisions: {
            create: {
              revisionNumber: 1,
              changedById: "system",
              reason: "Initial submission",
              beforeSnapshot: {},
              afterSnapshot: { items: itemsForCalc, totalEstimatePaise: evaluation.subtotalPaise },
            },
          },
        },
      });

      // Enqueue Outbox event
      await tx.outboxEvent.create({
        data: {
          type: "NEW_ENQUIRY_ADMIN_EMAIL",
          payload: {
            enquiryNumber: enquiry.enquiryNumber,
            customerName: enquiry.customerName,
            mobile: enquiry.mobile,
            totalPaise: enquiry.totalEstimatePaise,
          },
        },
      });

      return enquiry;
    });

    return {
      ok: true,
      data: {
        enquiryNumber: result.enquiryNumber,
        subtotalPaise: result.subtotalPaise,
        totalEstimatePaise: result.totalEstimatePaise,
      },
    };
  } catch (err: unknown) {
    // Check if unique constraint on idempotencyKey failed under race condition
    if (typeof err === "object" && err !== null && "code" in err && (err as any).code === "P2002") {
      const existingAfterRace = await prisma.enquiry.findUnique({
        where: { idempotencyKey },
      });
      if (existingAfterRace) {
        if (existingAfterRace.payloadHash !== payloadHash) {
          return {
            ok: false,
            code: "IDEMPOTENCY_MISMATCH",
            message: "This idempotency key was previously used with different enquiry details.",
          };
        }
        return {
          ok: true,
          data: {
            enquiryNumber: existingAfterRace.enquiryNumber,
            subtotalPaise: existingAfterRace.subtotalPaise,
            totalEstimatePaise: existingAfterRace.totalEstimatePaise,
          },
        };
      }
    }

    console.error("[submitEnquiryPipeline] Error:", err);
    return {
      ok: false,
      code: "SERVER_ERROR",
      message: "An unexpected error occurred while processing your enquiry. Please try again.",
    };
  }
}
