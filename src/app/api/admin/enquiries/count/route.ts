import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";

export async function GET() {
  const result = await withAdminAuth("ENQUIRIES_VIEW", async () => {
    const [newCount, totalCount] = await Promise.all([
      prisma.enquiry.count({
        where: { status: "NEW", isArchived: false },
      }),
      prisma.enquiry.count({
        where: { isArchived: false },
      }),
    ]);

    return {
      newCount,
      totalCount,
    };
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}
