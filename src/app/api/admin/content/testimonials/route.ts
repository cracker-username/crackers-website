import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { revalidateTag } from "next/cache";

const TestimonialSchema = z.object({
  name: z.string().trim().min(2).max(100),
  location: z.string().trim().min(2).max(100),
  rating: z.number().int().min(1).max(5).default(5),
  content: z.string().trim().min(5).max(1000),
  isActive: z.boolean().default(false),
});

export async function GET() {
  const result = await withAdminAuth("CONTENT_MANAGE", async () => {
    return await prisma.testimonial.findMany({
      orderBy: { createdAt: "desc" },
    });
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = TestimonialSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid testimonial data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await withAdminAuth("CONTENT_MANAGE", async (session) => {
    const testimonial = await prisma.testimonial.create({
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "TESTIMONIAL_CREATE",
        entity: "Testimonial",
        entityId: testimonial.id,
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
