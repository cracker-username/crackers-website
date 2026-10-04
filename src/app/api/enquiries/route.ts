import { NextRequest, NextResponse } from "next/server";
import { SubmitEnquiryPayloadSchema } from "@/lib/validation/enquiry";
import { submitEnquiryPipeline } from "@/lib/services/enquiryService";
import { checkRateLimit, hashIp } from "@/lib/security/rateLimiter";
import { generateEnquiryToken } from "@/lib/utils/token";
import { buildWhatsAppLink } from "@/lib/services/whatsapp";
import { prisma } from "@/lib/db/prisma";
import { parseSettingValue } from "@/lib/settings/registry";

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const ipHash = hashIp(ip);
    const rateLimit = await checkRateLimit({
      key: `enquiry_submit_${ipHash}`,
      limit: 10, // 10 submissions per 10 minutes
      windowSeconds: 600,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: "RATE_LIMITED",
          message: `Too many submissions. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // 2. Parse & Validate Payload
    const body = await req.json();
    const parsed = SubmitEnquiryPayloadSchema.safeParse(body.payload || body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "VALIDATION_ERROR",
          message: "Please check the details you entered.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const idempotencyKey =
      typeof body.idempotencyKey === "string" && body.idempotencyKey.trim().length > 0
        ? body.idempotencyKey.trim()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    const clientProvidedPrices = body.clientProvidedPrices || {};

    // 3. Execute Transactional Enquiry Pipeline
    const result = await submitEnquiryPipeline({
      payload,
      idempotencyKey,
      clientProvidedPrices,
    });

    if (!result.ok) {
      // Map domain errors to appropriate HTTP status codes
      let status = 400;
      if (result.code === "PRICE_CHANGED" || result.code === "ITEM_UNAVAILABLE" || result.code === "BELOW_MINIMUM") {
        status = 409; // Conflict
      } else if (result.code === "SERVER_ERROR") {
        status = 500;
      }
      return NextResponse.json(result, { status });
    }

    const enquiryNumber = result.data!.enquiryNumber;
    const token = generateEnquiryToken(enquiryNumber);

    // 4. Fetch business settings to build WhatsApp prefill URL
    const [bizNameSetting, bizPhoneSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "businessName" } }),
      prisma.setting.findUnique({ where: { key: "whatsappNumber" } }),
    ]);

    const businessName = bizNameSetting ? parseSettingValue("businessName", bizNameSetting.value) : "Sivakasi Sparklers";
    const whatsappNumber = bizPhoneSetting ? parseSettingValue("whatsappNumber", bizPhoneSetting.value) : "919876543210";

    const origin = req.headers.get("origin") || req.nextUrl.origin || "http://localhost:3000";
    const summaryUrl = `${origin}/enquiry/summary/${enquiryNumber}?token=${token}`;

    const itemsSummary = payload.items.map((i) => ({
      name: i.productId ? "Product" : "Combo Pack",
      quantity: i.quantity,
    }));

    const whatsappUrl = buildWhatsAppLink({
      businessName,
      whatsappNumber,
      enquiryNumber,
      customerName: payload.fullName,
      location: `${payload.city}, ${payload.state}`,
      items: itemsSummary,
      totalEstimatePaise: result.data!.totalEstimatePaise,
      summaryUrl,
    });

    return NextResponse.json({
      ok: true,
      data: {
        enquiryNumber,
        token,
        subtotalPaise: result.data!.subtotalPaise,
        totalEstimatePaise: result.data!.totalEstimatePaise,
        customerName: payload.fullName,
        whatsappUrl,
      },
    });
  } catch (err) {
    console.error("[POST /api/enquiries] Unhandled error:", err);
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        message: "An unexpected error occurred while processing your enquiry.",
      },
      { status: 500 }
    );
  }
}
