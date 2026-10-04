import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { EnquiryStatus, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const result = await withAdminAuth("ENQUIRIES_VIEW", async () => {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") as EnquiryStatus | null;
    const state = searchParams.get("state")?.trim() || "";
    const assignedToId = searchParams.get("assignedToId")?.trim() || "";
    const startDate = searchParams.get("startDate")?.trim() || "";
    const endDate = searchParams.get("endDate")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.EnquiryWhereInput = {
      isArchived: false,
    };

    if (status && Object.values(EnquiryStatus).includes(status)) {
      where.status = status;
    }

    if (state) {
      where.state = state;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (search) {
      where.OR = [
        { enquiryNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, enquiries, statusCounts] = await Promise.all([
      prisma.enquiry.count({ where }),
      prisma.enquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          enquiryNumber: true,
          customerName: true,
          mobile: true,
          whatsappNumber: true,
          state: true,
          city: true,
          pincode: true,
          preferredContact: true,
          status: true,
          totalEstimatePaise: true,
          subtotalPaise: true,
          createdAt: true,
          updatedAt: true,
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { items: true, notes: true, revisions: true },
          },
        },
      }),
      prisma.enquiry.groupBy({
        by: ["status"],
        where: { isArchived: false },
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
      enquiries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats,
    };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}
