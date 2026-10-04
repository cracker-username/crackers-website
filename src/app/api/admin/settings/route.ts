import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { revalidateTag } from "next/cache";
import { SettingsSchemaMap, parseSettingValue } from "@/lib/settings/registry";

export async function GET() {
  const result = await withAdminAuth("SETTINGS_MANAGE", async () => {
    const rows = await prisma.setting.findMany();
    const settingsMap: Record<string, any> = {};

    rows.forEach((r) => {
      settingsMap[r.key] = parseSettingValue(r.key as any, r.value);
    });

    Object.keys(SettingsSchemaMap).forEach((k) => {
      if (settingsMap[k] === undefined) {
        settingsMap[k] = parseSettingValue(k as any, undefined);
      }
    });

    return settingsMap;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 403 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const result = await withAdminAuth("SETTINGS_MANAGE", async (session) => {
    const updates: Array<{ key: string; value: any }> = [];

    for (const [key, rawValue] of Object.entries(body)) {
      if (key in SettingsSchemaMap) {
        const schema = SettingsSchemaMap[key as keyof typeof SettingsSchemaMap];
        const parsed = schema.safeParse(rawValue);
        if (parsed.success) {
          updates.push({ key, value: parsed.data });
        }
      }
    }

    if (updates.length === 0) {
      throw new Error("No valid settings provided to update.");
    }

    await prisma.$transaction(
      updates.map(({ key, value }) =>
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
        entityId: "global-settings",
        afterData: body,
      },
    });

    try {
      revalidateTag("settings");
    } catch {}

    return { message: "Settings saved successfully", updatedKeys: updates.map((u) => u.key) };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
