import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { revalidateTag } from "next/cache";

const UpdatePageSchema = z.object({
  title: z.string().trim().min(2).max(200),
  contentMd: z.string().min(10),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const result = await withAdminAuth("CONTENT_MANAGE", async () => {
    const page = await prisma.page.findUnique({
      where: { slug },
    });

    if (!page) {
      throw new Error("Page not found");
    }

    return page;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 404 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json();
  const parsed = UpdatePageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid page content", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await withAdminAuth("CONTENT_MANAGE", async (session) => {
    const page = await prisma.page.upsert({
      where: { slug },
      create: {
        slug,
        title: parsed.data.title,
        contentMd: parsed.data.contentMd,
      },
      update: {
        title: parsed.data.title,
        contentMd: parsed.data.contentMd,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "PAGE_UPDATE",
        entity: "Page",
        entityId: slug,
        afterData: { title: page.title },
      },
    });

    try {
      revalidateTag("pages");
    } catch {}

    return page;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
