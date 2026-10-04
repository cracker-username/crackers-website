import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { ShippingMode } from "@prisma/client";

const UpdateDeliveryRuleSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  isDefault: z.boolean().optional(),
  isDeliverable: z.boolean().optional(),
  minOrderPaise: z.number().int().min(0).optional(),
  shippingMode: z.nativeEnum(ShippingMode).optional(),
  freeShippingThresholdPaise: z.number().int().min(0).nullable().optional(),
  messageText: z.string().trim().min(2).optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
  stateCodes: z.array(z.string()).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateDeliveryRuleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid delivery rule update", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { stateCodes, ...fields } = parsed.data;

  const result = await withAdminAuth("DELIVERY_RULES_MANAGE", async (session) => {
    const updated = await prisma.deliveryRule.update({
      where: { id },
      data: {
        ...fields,
        ...(stateCodes
          ? {
              states: {
                set: stateCodes.map((code) => ({ code })),
              },
            }
          : {}),
      },
      include: {
        states: { select: { id: true, code: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "DELIVERY_RULE_UPDATE",
        entity: "DeliveryRule",
        entityId: id,
        afterData: parsed.data,
      },
    });

    return updated;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await withAdminAuth("DELIVERY_RULES_MANAGE", async (session) => {
    const existing = await prisma.deliveryRule.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Rule not found.");
    }
    if (existing.isDefault) {
      throw new Error("Cannot delete the default delivery rule.");
    }

    await prisma.deliveryRule.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "DELIVERY_RULE_DELETE",
        entity: "DeliveryRule",
        entityId: id,
      },
    });

    return { message: "Delivery rule deleted successfully", id };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
