import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { revalidateTag } from "next/cache";

const BannerSchema = z.object({
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().optional().nullable(),
  image: z.string().trim().min(1),
  linkUrl: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().default(0),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
});

export async function GET() {
  const result = await withAdminAuth("CONTENT_MANAGE", async () => {
    return await prisma.banner.findMany({
      orderBy: { sortOrder: "asc" },
    });
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = BannerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid banner data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const result = await withAdminAuth("CONTENT_MANAGE", async (session) => {
    const banner = await prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || null,
        image: data.image,
        linkUrl: data.linkUrl || null,
        sortOrder: data.sortOrder,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        status: data.status,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "BANNER_CREATE",
        entity: "Banner",
        entityId: banner.id,
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
