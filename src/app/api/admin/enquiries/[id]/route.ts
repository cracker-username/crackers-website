import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await withAdminAuth("ENQUIRIES_VIEW", async () => {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
        },
        revisions: {
          orderBy: { revisionNumber: "desc" },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!enquiry || enquiry.isArchived) {
      throw new Error("Enquiry not found or has been archived.");
    }

    return enquiry;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 404 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await withAdminAuth("ENQUIRIES_EDIT", async (session) => {
    const existing = await prisma.enquiry.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Enquiry not found.");
    }

    const archived = await prisma.enquiry.update({
      where: { id },
      data: {
        isArchived: true,
        version: { increment: 1 },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "ENQUIRY_ARCHIVE",
        entity: "Enquiry",
        entityId: id,
        beforeData: { enquiryNumber: existing.enquiryNumber, isArchived: false },
        afterData: { enquiryNumber: archived.enquiryNumber, isArchived: true },
      },
    });

    return { message: "Enquiry archived successfully", id: archived.id };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
