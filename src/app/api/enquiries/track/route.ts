import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, hashIp } from "@/lib/security/rateLimiter";
import { IndianMobileRegex } from "@/lib/validation/enquiry";
import { z } from "zod";

const TrackRequestSchema = z.object({
  enquiryNumber: z.string().trim().min(3).max(30),
  mobile: z.string().trim().regex(IndianMobileRegex, "Please enter a valid 10-digit mobile number"),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting by IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const ipHash = hashIp(ip);
    const rateLimit = await checkRateLimit({
      key: `track_enquiry_${ipHash}`,
      limit: 15, // 15 tracking checks per 10 minutes
      windowSeconds: 600,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: "RATE_LIMITED",
          message: `Too many tracking attempts. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // 2. Parse & validate input
    const body = await req.json();
    const parsed = TrackRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_INPUT",
          message: "Please enter a valid Enquiry Number and registered 10-digit Mobile Number.",
        },
        { status: 400 }
      );
    }

    const { enquiryNumber, mobile } = parsed.data;

    // 3. Query enquiry with matching number and mobile
    // Normalize enquiryNumber (uppercase)
    const normalizedNumber = enquiryNumber.toUpperCase();

    const enquiry = await prisma.enquiry.findFirst({
      where: {
        enquiryNumber: normalizedNumber,
        mobile: mobile,
        isArchived: false,
      },
      select: {
        enquiryNumber: true,
        customerName: true,
        status: true,
        city: true,
        state: true,
        totalEstimatePaise: true,
        subtotalPaise: true,
        shippingPaise: true,
        createdAt: true,
        transportName: true,
        lrNumber: true,
        items: {
          select: {
            id: true,
            name: true,
            unit: true,
            packSize: true,
            quantity: true,
            pricePaise: true,
            lineTotalPaise: true,
          },
        },
        statusHistory: {
          where: { visibleToCustomer: true },
          orderBy: { createdAt: "asc" },
          select: {
            toStatus: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    });

    // 4. Return generic error if not found to prevent phone number enumeration
    if (!enquiry) {
      return NextResponse.json(
        {
          ok: false,
          code: "NOT_FOUND",
          message: "No enquiry found matching this Enquiry Number and Mobile Number. Please check your details and try again.",
        },
        { status: 404 }
      );
    }

    // 5. Return sanitized customer payload (never leaks internal notes, staff identities or addresses)
    return NextResponse.json({
      ok: true,
      data: {
        enquiryNumber: enquiry.enquiryNumber,
        customerName: enquiry.customerName,
        status: enquiry.status,
        city: enquiry.city,
        state: enquiry.state,
        totalEstimatePaise: enquiry.totalEstimatePaise,
        subtotalPaise: enquiry.subtotalPaise,
        shippingPaise: enquiry.shippingPaise,
        createdAt: enquiry.createdAt.toISOString(),
        transportName: enquiry.transportName,
        lrNumber: enquiry.lrNumber,
        items: enquiry.items,
        timeline: enquiry.statusHistory.map((h) => ({
          status: h.toStatus,
          message: h.comment,
          timestamp: h.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    console.error("[POST /api/enquiries/track] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        message: "An unexpected error occurred while fetching tracking details.",
      },
      { status: 500 }
    );
  }
}
