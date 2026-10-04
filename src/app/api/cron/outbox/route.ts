import { NextRequest, NextResponse } from "next/server";
import { processOutboxBatch } from "@/lib/services/outboxService";

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || "crackers-cron-secret-2026";
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");

  const providedSecret = authHeader?.replace("Bearer ", "") || querySecret;

  if (providedSecret !== cronSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processOutboxBatch(50);
    return NextResponse.json({
      ok: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("[CRON /api/cron/outbox] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to process outbox events",
      },
      { status: 500 }
    );
  }
}
