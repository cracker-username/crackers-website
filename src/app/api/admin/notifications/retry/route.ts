import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";

const RetrySchema = z.object({
  eventId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = RetrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid event ID", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { eventId } = parsed.data;

  const result = await withAdminAuth("NOTIFICATIONS_RETRY", async (session) => {
    const existing = await prisma.outboxEvent.findUnique({ where: { id: eventId } });
    if (!existing) {
      throw new Error("Outbox event not found.");
    }

    const retried = await prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: "PENDING",
        attempts: 0,
        nextAttemptAt: new Date(),
        lastError: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "NOTIFICATION_RETRY",
        entity: "OutboxEvent",
        entityId: eventId,
        beforeData: { status: existing.status, attempts: existing.attempts },
        afterData: { status: "PENDING" },
      },
    });

    return retried;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
