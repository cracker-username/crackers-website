import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { revalidateTag } from "next/cache";

const FaqSchema = z.object({
  question: z.string().trim().min(3).max(300),
  answer: z.string().trim().min(3),
  category: z.string().trim().default("General"),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const result = await withAdminAuth("CONTENT_MANAGE", async () => {
    return await prisma.faq.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = FaqSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid FAQ data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await withAdminAuth("CONTENT_MANAGE", async (session) => {
    const faq = await prisma.faq.create({
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "FAQ_CREATE",
        entity: "Faq",
        entityId: faq.id,
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
