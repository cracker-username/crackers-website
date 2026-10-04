import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { calculateDiscountPercent } from "@/lib/utils/money";
import { z } from "zod";

const RevisionItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().uuid().optional().nullable(),
  comboId: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  unit: z.string().trim().default("box"),
  packSize: z.string().trim().default("1 Pc"),
  pricePaise: z.number().int().min(0),
  mrpPaise: z.number().int().min(0),
  quantity: z.number().int().min(1),
});

const RevisionSchema = z.object({
  reason: z.string().trim().min(5, "A clear reason (at least 5 characters) is required for revising an enquiry"),
  items: z.array(RevisionItemSchema).min(1, "At least one item is required in the revised enquiry"),
  extraDiscountPaise: z.number().int().min(0).default(0),
  shippingPaise: z.number().int().min(0).default(0),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = RevisionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid enquiry revision request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { reason, items, extraDiscountPaise, shippingPaise } = parsed.data;

  const result = await withAdminAuth("ENQUIRIES_EDIT", async (session) => {
    const current = await prisma.enquiry.findUnique({
      where: { id },
      include: {
        items: true,
        revisions: { orderBy: { revisionNumber: "desc" }, take: 1 },
      },
    });

    if (!current || current.isArchived) {
      throw new Error("Enquiry not found or is archived.");
    }

    // 1. Recalculate totals
    let subtotalPaise = 0;
    const itemsWithTotals = items.map((it) => {
      const lineTotalPaise = it.pricePaise * it.quantity;
      subtotalPaise += lineTotalPaise;
      const discountPercent = calculateDiscountPercent(it.mrpPaise, it.pricePaise);
      return {
        ...it,
        discountPercent,
        lineTotalPaise,
      };
    });

    const totalEstimatePaise = Math.max(0, subtotalPaise - extraDiscountPaise + shippingPaise);

    // 2. Prepare snapshots
    const beforeSnapshot = {
      subtotalPaise: current.subtotalPaise,
      extraDiscountPaise: current.extraDiscountPaise,
      shippingPaise: current.shippingPaise,
      totalEstimatePaise: current.totalEstimatePaise,
      items: current.items.map((i) => ({
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        pricePaise: i.pricePaise,
        mrpPaise: i.mrpPaise,
        lineTotalPaise: i.lineTotalPaise,
      })),
    };

    const afterSnapshot = {
      subtotalPaise,
      extraDiscountPaise,
      shippingPaise,
      totalEstimatePaise,
      items: itemsWithTotals.map((i) => ({
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        pricePaise: i.pricePaise,
        mrpPaise: i.mrpPaise,
        lineTotalPaise: i.lineTotalPaise,
      })),
    };

    const nextRevisionNumber = (current.revisions[0]?.revisionNumber || 0) + 1;

    // 3. Execute revision in single transaction
    const revised = await prisma.$transaction(async (tx) => {
      // Create EnquiryRevision record
      await tx.enquiryRevision.create({
        data: {
          enquiryId: id,
          revisionNumber: nextRevisionNumber,
          changedById: session.user.id,
          reason,
          beforeSnapshot,
          afterSnapshot,
        },
      });

      // Delete existing EnquiryItems
      await tx.enquiryItem.deleteMany({ where: { enquiryId: id } });

      // Create new EnquiryItems
      await tx.enquiryItem.createMany({
        data: itemsWithTotals.map((it) => ({
          enquiryId: id,
          productId: it.productId || null,
          comboId: it.comboId || null,
          name: it.name,
          sku: it.sku,
          unit: it.unit,
          packSize: it.packSize,
          pricePaise: it.pricePaise,
          mrpPaise: it.mrpPaise,
          discountPercent: it.discountPercent,
          quantity: it.quantity,
          lineTotalPaise: it.lineTotalPaise,
        })),
      });

      // Update Enquiry totals and version
      const updatedEnquiry = await tx.enquiry.update({
        where: { id },
        data: {
          subtotalPaise,
          extraDiscountPaise,
          shippingPaise,
          totalEstimatePaise,
          version: { increment: 1 },
        },
        include: {
          items: true,
          revisions: { orderBy: { revisionNumber: "desc" } },
        },
      });

      // Write to AuditLog
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "ENQUIRY_REVISION",
          entity: "Enquiry",
          entityId: id,
          beforeData: beforeSnapshot,
          afterData: { ...afterSnapshot, revisionNumber: nextRevisionNumber, reason },
        },
      });

      return updatedEnquiry;
    });

    return revised;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
