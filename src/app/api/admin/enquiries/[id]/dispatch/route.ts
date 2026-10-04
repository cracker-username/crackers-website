import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";

const DispatchSchema = z.object({
  transportName: z.string().trim().min(1, "Carrier / Transporter name is required").max(100),
  lrNumber: z.string().trim().min(1, "LR / Consignment number is required").max(100),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = DispatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid dispatch details", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { transportName, lrNumber } = parsed.data;

  const result = await withAdminAuth("ENQUIRIES_EDIT", async (session) => {
    const updated = await prisma.$transaction(async (tx) => {
      const enq = await tx.enquiry.update({
        where: { id },
        data: {
          transportName,
          lrNumber,
          version: { increment: 1 },
        },
      });

      await tx.enquiryStatusHistory.create({
        data: {
          enquiryId: id,
          toStatus: enq.status,
          changedById: session.user.id,
          comment: `Dispatched via ${transportName} (LR: ${lrNumber})`,
          visibleToCustomer: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "ENQUIRY_DISPATCH_UPDATE",
          entity: "Enquiry",
          entityId: id,
          afterData: { transportName, lrNumber },
        },
      });

      return enq;
    });

    return updated;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
