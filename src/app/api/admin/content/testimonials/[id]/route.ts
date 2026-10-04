import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { revalidateTag } from "next/cache";

const UpdateTestimonialSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  location: z.string().trim().min(2).max(100).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  content: z.string().trim().min(5).max(1000).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateTestimonialSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid testimonial update", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await withAdminAuth("CONTENT_MANAGE", async (session) => {
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "TESTIMONIAL_UPDATE",
        entity: "Testimonial",
        entityId: id,
        afterData: parsed.data,
      },
    });

    try {
      revalidateTag("testimonials");
    } catch {}

    return testimonial;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await withAdminAuth("CONTENT_MANAGE", async (session) => {
    await prisma.testimonial.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "TESTIMONIAL_DELETE",
        entity: "Testimonial",
        entityId: id,
      },
    });

    try {
      revalidateTag("testimonials");
    } catch {}

    return { message: "Testimonial deleted successfully", id };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
