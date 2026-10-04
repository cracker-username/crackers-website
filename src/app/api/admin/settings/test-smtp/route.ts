import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";

export async function POST() {
  const result = await withAdminAuth("SETTINGS_MANAGE", async (session) => {
    // Queue a test outbox event
    const event = await prisma.outboxEvent.create({
      data: {
        type: "ADMIN_TEST_EMAIL",
        payload: {
          recipient: session.user.email,
          subject: "Test Notification — Crackers Operations System",
          message: "This is a test notification dispatched from Admin Settings.",
          sentAt: new Date().toISOString(),
        },
        status: "PENDING",
      },
    });

    return {
      message: `Test notification queued successfully into Outbox (Event ID: ${event.id}). It will be processed on the next outbox run.`,
      eventId: event.id,
    };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
