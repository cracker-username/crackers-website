import { prisma } from "../db/prisma";
import {
  getIstStartOfToday,
  getIstStartOfWeek,
  getIstDaysAgo,
  formatIstDateOnly,
} from "../utils/dates";
import { EnquiryStatus, OutboxStatus } from "@prisma/client";

export interface DashboardMetrics {
  enquiriesToday: number;
  enquiriesThisWeek: number;
  totalEnquiries: number;
  totalEnquiryValuePaise: number;
  confirmedSharePercent: number;
  statusCounts: Record<EnquiryStatus, number>;
  outOfStockCount: number;
  lowStockCount: number;
  failedNotificationsCount: number;
  topStates: Array<{ state: string; count: number }>;
  topProducts: Array<{ name: string; quantity: number; totalPaise: number }>;
  recentEnquiries: Array<{
    id: string;
    enquiryNumber: string;
    customerName: string;
    mobile: string;
    state: string;
    status: EnquiryStatus;
    totalEstimatePaise: number;
    createdAt: string;
  }>;
  sevenDayTrends: Array<{
    dateLabel: string;
    count: number;
    valuePaise: number;
  }>;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const istTodayStart = getIstStartOfToday();
  const istWeekStart = getIstStartOfWeek();

  const [
    enquiriesToday,
    enquiriesThisWeek,
    totalEnquiries,
    valueAgg,
    statusGroup,
    outOfStockCount,
    lowStockCount,
    failedNotificationsCount,
    recentEnquiriesRaw,
  ] = await Promise.all([
    // 1. Enquiries today IST
    prisma.enquiry.count({
      where: { createdAt: { gte: istTodayStart }, isArchived: false },
    }),
    // 2. Enquiries this week IST
    prisma.enquiry.count({
      where: { createdAt: { gte: istWeekStart }, isArchived: false },
    }),
    // 3. Total active enquiries
    prisma.enquiry.count({
      where: { isArchived: false },
    }),
    // 4. Total enquiry value in paise
    prisma.enquiry.aggregate({
      where: { isArchived: false },
      _sum: { totalEstimatePaise: true },
    }),
    // 5. Enquiries grouped by status
    prisma.enquiry.groupBy({
      by: ["status"],
      where: { isArchived: false },
      _count: { _all: true },
    }),
    // 6. Out of stock products
    prisma.product.count({
      where: {
        isArchived: false,
        isActive: true,
        availability: { in: ["OUT_OF_STOCK", "UNAVAILABLE"] },
      },
    }),
    // 7. Low stock products (stockQuantity <= lowStockThreshold and > 0)
    prisma.product.count({
      where: {
        isArchived: false,
        isActive: true,
        stockQuantity: { not: null, gt: 0 },
        // Prisma doesn't do field-to-field comparisons in where, so approximate threshold:
        availability: "LIMITED",
      },
    }),
    // 8. Failed or dead outbox notifications
    prisma.outboxEvent.count({
      where: {
        status: { in: [OutboxStatus.FAILED, OutboxStatus.DEAD] },
      },
    }),
    // 9. Recent enquiries
    prisma.enquiry.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        enquiryNumber: true,
        customerName: true,
        mobile: true,
        state: true,
        status: true,
        totalEstimatePaise: true,
        createdAt: true,
      },
    }),
  ]);

  // Build complete status map with defaults
  const allStatuses: EnquiryStatus[] = [
    "NEW",
    "CONTACTED",
    "QUOTE_SENT",
    "AWAITING_CUSTOMER",
    "CONFIRMED",
    "READY",
    "DISPATCHED",
    "COMPLETED",
    "CANCELLED",
  ];

  const statusCounts: Record<EnquiryStatus, number> = {} as any;
  allStatuses.forEach((s) => {
    statusCounts[s] = 0;
  });

  statusGroup.forEach((g) => {
    statusCounts[g.status] = g._count._all;
  });

  // Confirmed or later share: (CONFIRMED + READY + DISPATCHED + COMPLETED) / totalEnquiries
  const confirmedCount =
    (statusCounts["CONFIRMED"] || 0) +
    (statusCounts["READY"] || 0) +
    (statusCounts["DISPATCHED"] || 0) +
    (statusCounts["COMPLETED"] || 0);

  const confirmedSharePercent =
    totalEnquiries > 0 ? Math.round((confirmedCount / totalEnquiries) * 100) : 0;

  // Top states by count
  const stateGroups = await prisma.enquiry.groupBy({
    by: ["state"],
    where: { isArchived: false },
    _count: { _all: true },
    orderBy: { _count: { state: "desc" } },
    take: 5,
  });

  const topStates = stateGroups.map((g) => ({
    state: g.state,
    count: g._count._all,
  }));

  // Top products by quantity from EnquiryItem
  const topItemsRaw = await prisma.enquiryItem.groupBy({
    by: ["name"],
    _sum: { quantity: true, lineTotalPaise: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  const topProducts = topItemsRaw.map((it) => ({
    name: it.name,
    quantity: it._sum.quantity || 0,
    totalPaise: it._sum.lineTotalPaise || 0,
  }));

  // 7-day trend calculation (past 7 IST days)
  const sevenDayTrends: Array<{ dateLabel: string; count: number; valuePaise: number }> = [];

  for (let i = 6; i >= 0; i--) {
    const dayStart = getIstDaysAgo(i);
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dateLabel = formatIstDateOnly(dayStart);

    const [dayCount, dayValue] = await Promise.all([
      prisma.enquiry.count({
        where: {
          createdAt: { gte: dayStart, lt: dayEnd },
          isArchived: false,
        },
      }),
      prisma.enquiry.aggregate({
        where: {
          createdAt: { gte: dayStart, lt: dayEnd },
          isArchived: false,
        },
        _sum: { totalEstimatePaise: true },
      }),
    ]);

    sevenDayTrends.push({
      dateLabel,
      count: dayCount,
      valuePaise: dayValue._sum.totalEstimatePaise || 0,
    });
  }

  return {
    enquiriesToday,
    enquiriesThisWeek,
    totalEnquiries,
    totalEnquiryValuePaise: valueAgg._sum.totalEstimatePaise || 0,
    confirmedSharePercent,
    statusCounts,
    outOfStockCount,
    lowStockCount,
    failedNotificationsCount,
    topStates,
    topProducts,
    recentEnquiries: recentEnquiriesRaw.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
    sevenDayTrends,
  };
}
