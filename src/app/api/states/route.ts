import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const [states, deliveryRules] = await Promise.all([
      prisma.state.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.deliveryRule.findMany({
        where: { isActive: true },
        include: { states: true },
        orderBy: { priority: "desc" },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        states,
        deliveryRules,
      },
    });
  } catch (err) {
    console.error("[GET /api/states] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load states" },
      { status: 500 }
    );
  }
}
