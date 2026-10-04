import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { calculateDiscountPercent } from "@/lib/utils/money";

const BulkActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("BULK_AVAILABILITY"),
    productIds: z.array(z.string().uuid()).min(1),
    availability: z.enum(["IN_STOCK", "LIMITED", "OUT_OF_STOCK", "UNAVAILABLE"]),
  }),
  z.object({
    action: z.literal("BULK_ACTIVE"),
    productIds: z.array(z.string().uuid()).min(1),
    isActive: z.boolean(),
  }),
  z.object({
    action: z.literal("BULK_ARCHIVE"),
    productIds: z.array(z.string().uuid()).min(1),
  }),
  z.object({
    action: z.literal("BULK_RESTORE"),
    productIds: z.array(z.string().uuid()).min(1),
  }),
  z.object({
    action: z.literal("BULK_CATEGORY"),
    productIds: z.array(z.string().uuid()).min(1),
    categoryId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("BULK_PRICE_PREVIEW"),
    productIds: z.array(z.string().uuid()).optional(),
    categoryId: z.string().uuid().optional(),
    mode: z.enum(["PERCENTAGE", "FIXED"]),
    adjustment: z.number(), // +10% or -5%, or +5000 paise (Rs 50)
    roundToNearestRupee: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("BULK_PRICE_APPLY"),
    productIds: z.array(z.string().uuid()).optional(),
    categoryId: z.string().uuid().optional(),
    mode: z.enum(["PERCENTAGE", "FIXED"]),
    adjustment: z.number(),
    roundToNearestRupee: z.boolean().default(true),
    confirm: z.literal(true),
  }),
]);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = BulkActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "INVALID_REQUEST", message: "Invalid bulk operation request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = parsed.data;

  // Bulk Price Update requires PRODUCTS_BULK_PRICE permission (SUPER_ADMIN only)
  const requiredPermission =
    payload.action === "BULK_PRICE_PREVIEW" || payload.action === "BULK_PRICE_APPLY"
      ? "PRODUCTS_BULK_PRICE"
      : "PRODUCTS_CRUD";

  const result = await withAdminAuth(requiredPermission, async (session) => {
    switch (payload.action) {
      case "BULK_AVAILABILITY": {
        const updated = await prisma.product.updateMany({
          where: { id: { in: payload.productIds } },
          data: {
            availability: payload.availability,
            version: { increment: 1 },
          },
        });
        revalidateTag("products");
        return { updatedCount: updated.count };
      }

      case "BULK_ACTIVE": {
        const updated = await prisma.product.updateMany({
          where: { id: { in: payload.productIds } },
          data: {
            isActive: payload.isActive,
            version: { increment: 1 },
          },
        });
        revalidateTag("products");
        return { updatedCount: updated.count };
      }

      case "BULK_ARCHIVE": {
        const updated = await prisma.product.updateMany({
          where: { id: { in: payload.productIds } },
          data: {
            isArchived: true,
            version: { increment: 1 },
          },
        });
        revalidateTag("products");
        return { updatedCount: updated.count };
      }

      case "BULK_RESTORE": {
        const updated = await prisma.product.updateMany({
          where: { id: { in: payload.productIds } },
          data: {
            isArchived: false,
            version: { increment: 1 },
          },
        });
        revalidateTag("products");
        return { updatedCount: updated.count };
      }

      case "BULK_CATEGORY": {
        const updated = await prisma.product.updateMany({
          where: { id: { in: payload.productIds } },
          data: {
            categoryId: payload.categoryId,
            version: { increment: 1 },
          },
        });
        revalidateTag("products");
        return { updatedCount: updated.count };
      }

      case "BULK_PRICE_PREVIEW":
      case "BULK_PRICE_APPLY": {
        const where: any = { isArchived: false };
        if (payload.productIds && payload.productIds.length > 0) {
          where.id = { in: payload.productIds };
        } else if (payload.categoryId) {
          where.categoryId = payload.categoryId;
        } else {
          throw new Error("Must select either specific products or a category for bulk price updates.");
        }

        const products = await prisma.product.findMany({
          where,
          select: { id: true, sku: true, name: true, mrpPaise: true, pricePaise: true },
        });

        if (products.length === 0) {
          throw new Error("No active products found matching the criteria.");
        }

        // Calculate previews
        const previewRows = products.map((prod) => {
          let calculatedPaise = prod.pricePaise;

          if (payload.mode === "PERCENTAGE") {
            // adjustment is in percentage, e.g. 10 or -5
            calculatedPaise = Math.round(prod.pricePaise * (1 + payload.adjustment / 100));
          } else {
            // adjustment is in paise, e.g. +5000 or -2000
            calculatedPaise = prod.pricePaise + payload.adjustment;
          }

          if (payload.roundToNearestRupee) {
            calculatedPaise = Math.round(calculatedPaise / 100) * 100;
          }

          let isValid = true;
          let error: string | undefined;

          if (calculatedPaise <= 0) {
            isValid = false;
            error = "Price cannot be zero or negative.";
          } else if (calculatedPaise > prod.mrpPaise && prod.mrpPaise > 0) {
            isValid = false;
            error = `New price (₹${calculatedPaise / 100}) exceeds MRP (₹${prod.mrpPaise / 100}).`;
          }

          const newDiscountPercent = calculateDiscountPercent(prod.mrpPaise, calculatedPaise);

          return {
            id: prod.id,
            sku: prod.sku,
            name: prod.name,
            oldPricePaise: prod.pricePaise,
            newPricePaise: calculatedPaise,
            mrpPaise: prod.mrpPaise,
            newDiscountPercent,
            isValid,
            error,
          };
        });

        // If PREVIEW, return preview rows
        if (payload.action === "BULK_PRICE_PREVIEW") {
          return {
            totalProducts: products.length,
            invalidCount: previewRows.filter((r) => !r.isValid).length,
            previewRows,
          };
        }

        // If APPLY, verify that all rows are valid
        const invalidRows = previewRows.filter((r) => !r.isValid);
        if (invalidRows.length > 0) {
          throw new Error(`Cannot apply bulk price update: ${invalidRows.length} products would have invalid prices.`);
        }

        // Execute in transaction
        await prisma.$transaction(
          previewRows.map((r) =>
            prisma.product.update({
              where: { id: r.id },
              data: {
                pricePaise: r.newPricePaise,
                version: { increment: 1 },
              },
            })
          )
        );

        // Audit log
        await prisma.auditLog.create({
          data: {
            actorId: session.user.id,
            action: "BULK_PRICE_UPDATE",
            entity: "Product",
            entityId: "bulk",
            afterData: {
              updatedCount: previewRows.length,
              mode: payload.mode,
              adjustment: payload.adjustment,
            },
          },
        });

        revalidateTag("products");

        return {
          updatedCount: previewRows.length,
          message: `Successfully updated prices for ${previewRows.length} products.`,
        };
      }
    }
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
