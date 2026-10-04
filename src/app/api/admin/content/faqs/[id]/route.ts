import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { revalidateTag } from "next/cache";

const UpdateFaqSchema = z.object({
  question: z.string().trim().min(3).max(300).optional(),
  answer: z.string().trim().min(3).optional(),
  category: z.string().trim().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateFaqSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid FAQ update", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await withAdminAuth("CONTENT_MANAGE", async (session) => {
    const faq = await prisma.faq.update({
      where: { id },
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "FAQ_UPDATE",
        entity: "Faq",
        entityId: id,
        afterData: parsed.data,
      },
    });

    try {
      revalidateTag("faqs");
    } catch {}

    return faq;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await withAdminAuth("CONTENT_MANAGE", async (session) => {
    await prisma.faq.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "FAQ_DELETE",
        entity: "Faq",
        entityId: id,
      },
    });

    try {
      revalidateTag("faqs");
    } catch {}

    return { message: "FAQ deleted successfully", id };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
