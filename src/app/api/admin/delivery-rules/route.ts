import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { ShippingMode } from "@prisma/client";

const CreateDeliveryRuleSchema = z.object({
  name: z.string().trim().min(2).max(100),
  isDefault: z.boolean().default(false),
  isDeliverable: z.boolean().default(true),
  minOrderPaise: z.number().int().min(0),
  shippingMode: z.nativeEnum(ShippingMode).default("CONFIRMED_OFFLINE"),
  freeShippingThresholdPaise: z.number().int().min(0).nullable().optional(),
  messageText: z.string().trim().min(2),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
  stateCodes: z.array(z.string()).default([]),
});

export async function GET() {
  const result = await withAdminAuth("DELIVERY_RULES_MANAGE", async () => {
    return await prisma.deliveryRule.findMany({
      include: {
        states: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateDeliveryRuleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid delivery rule data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const result = await withAdminAuth("DELIVERY_RULES_MANAGE", async (session) => {
    const rule = await prisma.deliveryRule.create({
      data: {
        name: data.name,
        isDefault: data.isDefault,
        isDeliverable: data.isDeliverable,
        minOrderPaise: data.minOrderPaise,
        shippingMode: data.shippingMode,
        freeShippingThresholdPaise: data.freeShippingThresholdPaise || null,
        messageText: data.messageText,
        priority: data.priority,
        isActive: data.isActive,
        states: {
          connect: data.stateCodes.map((code) => ({ code })),
        },
      },
      include: {
        states: { select: { id: true, code: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "DELIVERY_RULE_CREATE",
        entity: "DeliveryRule",
        entityId: rule.id,
        afterData: data,
      },
    });

    return rule;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
