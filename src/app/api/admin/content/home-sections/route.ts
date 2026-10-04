import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { parseSettingValue } from "@/lib/settings/registry";

const HomeContentSchema = z.object({
  countdownTitle: z.string().trim().optional(),
  countdownTarget: z.string().trim().optional(),
  countdownEnabled: z.boolean().optional(),
  homepageSectionsOrder: z.array(z.object({ id: z.string(), enabled: z.boolean() })).optional(),
});

export async function GET() {
  const result = await withAdminAuth("CONTENT_MANAGE", async () => {
    const keys = ["countdownTitle", "countdownTarget", "countdownEnabled", "homepageSectionsOrder"];
    const rows = await prisma.setting.findMany({
      where: { key: { in: keys } },
    });

    const settingsMap: Record<string, any> = {};
    rows.forEach((r) => {
      settingsMap[r.key] = parseSettingValue(r.key as any, r.value);
    });

    keys.forEach((k) => {
      if (settingsMap[k] === undefined) {
        settingsMap[k] = parseSettingValue(k as any, undefined);
      }
    });

    return settingsMap;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const parsed = HomeContentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid home content settings", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const result = await withAdminAuth("CONTENT_MANAGE", async (session) => {
    await prisma.$transaction(
      Object.entries(data).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          create: {
            key,
            value: value as any,
            updatedById: session.user.id,
          },
          update: {
            value: value as any,
            updatedById: session.user.id,
          },
        })
      )
    );

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "SETTINGS_UPDATE",
        entity: "Setting",
        entityId: "home-sections",
        afterData: data,
      },
    });

    try {
      revalidateTag("settings");
    } catch {}

    return { message: "Home content settings updated successfully" };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
