import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { isStatusTransitionAllowed } from "@/lib/services/statusMachine";
import { EnquiryStatus } from "@prisma/client";
import { z } from "zod";

const StatusTransitionSchema = z.object({
  targetStatus: z.nativeEnum(EnquiryStatus),
  comment: z.string().trim().optional(),
  reopenReason: z.string().trim().optional(),
  visibleToCustomer: z.boolean().default(true),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = StatusTransitionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid status transition request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { targetStatus, comment, reopenReason, visibleToCustomer } = parsed.data;

  const result = await withAdminAuth("ENQUIRIES_STATUS", async (session) => {
    const current = await prisma.enquiry.findUnique({
      where: { id },
    });

    if (!current) {
      throw new Error("Enquiry not found.");
    }

    const check = isStatusTransitionAllowed({
      from: current.status,
      to: targetStatus,
      role: session.user.role,
      reopenReason,
    });

    if (!check.allowed) {
      const err: any = new Error(check.reason || "Invalid status transition.");
      err.code = "INVALID_TRANSITION";
      throw err;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update enquiry status
      const enq = await tx.enquiry.update({
        where: { id },
        data: {
          status: targetStatus,
          version: { increment: 1 },
        },
      });

      // 2. Append to EnquiryStatusHistory
      await tx.enquiryStatusHistory.create({
        data: {
          enquiryId: id,
          fromStatus: current.status,
          toStatus: targetStatus,
          changedById: session.user.id,
          comment: comment || reopenReason || null,
          visibleToCustomer,
        },
      });

      // 3. Write to AuditLog
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "ENQUIRY_STATUS_CHANGE",
          entity: "Enquiry",
          entityId: id,
          beforeData: { status: current.status, version: current.version },
          afterData: { status: targetStatus, version: enq.version, comment: comment || reopenReason },
        },
      });

      return enq;
    });

    return updated;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
