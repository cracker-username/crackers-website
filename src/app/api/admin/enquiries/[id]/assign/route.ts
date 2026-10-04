import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";

const AssignSchema = z.object({
  assignedToId: z.string().uuid().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = AssignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid staff assignment", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { assignedToId } = parsed.data;

  const result = await withAdminAuth("ENQUIRIES_EDIT", async (session) => {
    let staffName: string | null = null;
    if (assignedToId) {
      const staff = await prisma.adminUser.findUnique({
        where: { id: assignedToId, isActive: true },
        select: { name: true },
      });
      if (!staff) {
        throw new Error("Selected staff user does not exist or is inactive.");
      }
      staffName = staff.name;
    }

    const updated = await prisma.enquiry.update({
      where: { id },
      data: {
        assignedToId,
        version: { increment: 1 },
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "ENQUIRY_ASSIGN",
        entity: "Enquiry",
        entityId: id,
        afterData: { assignedToId, staffName },
      },
    });

    return updated;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
