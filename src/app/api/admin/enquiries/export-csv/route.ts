import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { paiseToRupees } from "@/lib/utils/money";
import { formatToKolkataTime } from "@/lib/utils/dates";
import { EnquiryStatus, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const result = await withAdminAuth("ENQUIRIES_VIEW", async () => {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") as EnquiryStatus | null;
    const state = searchParams.get("state")?.trim() || "";

    const where: Prisma.EnquiryWhereInput = {
      isArchived: false,
    };

    if (status && Object.values(EnquiryStatus).includes(status)) {
      where.status = status;
    }

    if (state) {
      where.state = state;
    }

    if (search) {
      where.OR = [
        { enquiryNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search } },
      ];
    }

    const enquiries = await prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { items: true } },
      },
    });

    const headers = [
      "Enquiry Number",
      "Date (IST)",
      "Customer Name",
      "Mobile",
      "WhatsApp",
      "State",
      "City",
      "Items Count",
      "Total Amount (₹)",
      "Status",
      "Carrier / Transporter",
      "LR Number",
    ];

    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = enquiries.map((e) => [
      escapeCsv(e.enquiryNumber),
      escapeCsv(formatToKolkataTime(e.createdAt)),
      escapeCsv(e.customerName),
      escapeCsv(e.mobile),
      escapeCsv(e.whatsappNumber || ""),
      escapeCsv(e.state),
      escapeCsv(e.city),
      escapeCsv(e._count.items),
      escapeCsv(paiseToRupees(e.totalEstimatePaise)),
      escapeCsv(e.status),
      escapeCsv(e.transportName || ""),
      escapeCsv(e.lrNumber || ""),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return csvContent;
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 401 });
  }

  const timestamp = new Date().toISOString().split("T")[0];
  return new NextResponse(result.data, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="enquiries_export_${timestamp}.csv"`,
    },
  });
}
