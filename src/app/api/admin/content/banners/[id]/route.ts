import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { revalidateTag } from "next/cache";

const UpdateBannerSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  subtitle: z.string().trim().optional().nullable(),
  image: z.string().trim().min(1).optional(),
  linkUrl: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().optional(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateBannerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid banner update", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const result = await withAdminAuth("CONTENT_MANAGE", async (session) => {
    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...data,
        startsAt: data.startsAt !== undefined ? (data.startsAt ? new Date(data.startsAt) : null) : undefined,
        endsAt: data.endsAt !== undefined ? (data.endsAt ? new Date(data.endsAt) : null) : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "BANNER_UPDATE",
        entity: "Banner",
        entityId: id,
        afterData: data,
      },
    });

    try {
      revalidateTag("banners");
    } catch {}

    return banner;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await withAdminAuth("CONTENT_MANAGE", async (session) => {
    await prisma.banner.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "BANNER_DELETE",
        entity: "Banner",
        entityId: id,
      },
    });

    try {
      revalidateTag("banners");
    } catch {}

    return { message: "Banner deleted successfully", id };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
