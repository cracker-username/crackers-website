import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";

const RestrictedPincodeSchema = z.object({
  pincode: z.string().trim().regex(/^\d{6}$/, "Must be a 6-digit Indian postal pincode"),
  reason: z.string().trim().optional(),
});

export async function GET() {
  const result = await withAdminAuth("DELIVERY_RULES_MANAGE", async () => {
    return await prisma.restrictedPincode.findMany({
      orderBy: { createdAt: "desc" },
    });
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = RestrictedPincodeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid pincode data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await withAdminAuth("DELIVERY_RULES_MANAGE", async (session) => {
    const created = await prisma.restrictedPincode.upsert({
      where: { pincode: parsed.data.pincode },
      create: parsed.data,
      update: { reason: parsed.data.reason },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "RESTRICTED_PINCODE_ADD",
        entity: "RestrictedPincode",
        entityId: created.pincode,
        afterData: parsed.data,
      },
    });

    return created;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pincode = searchParams.get("pincode");

  if (!pincode) {
    return NextResponse.json(
      { ok: false, code: "MISSING_PINCODE", message: "Pincode parameter is required" },
      { status: 400 }
    );
  }

  const result = await withAdminAuth("DELIVERY_RULES_MANAGE", async (session) => {
    await prisma.restrictedPincode.delete({ where: { pincode } });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "RESTRICTED_PINCODE_REMOVE",
        entity: "RestrictedPincode",
        entityId: pincode,
      },
    });

    return { message: "Pincode restriction removed", pincode };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
