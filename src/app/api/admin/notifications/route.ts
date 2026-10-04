import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { OutboxStatus, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const result = await withAdminAuth("NOTIFICATIONS_VIEW", async () => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as OutboxStatus | null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.OutboxEventWhereInput = {};
    if (status && Object.values(OutboxStatus).includes(status)) {
      where.status = status;
    }

    const [total, events, statusCounts] = await Promise.all([
      prisma.outboxEvent.count({ where }),
      prisma.outboxEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.outboxEvent.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

    let totalCount = 0;
    const stats: Record<string, number> = {};
    statusCounts.forEach((sc) => {
      stats[sc.status] = sc._count.status;
      totalCount += sc._count.status;
    });
    stats.TOTAL = totalCount;

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats,
    };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 403 });
}
