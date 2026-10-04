import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { validateCsvRows } from "@/lib/validation/csv";
import Papa from "papaparse";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  const result = await withAdminAuth("PRODUCTS_CSV_IMPORT", async (session) => {
    const body = await req.json();
    const { csvContent, previewOnly, confirm } = body;

    if (!csvContent || typeof csvContent !== "string") {
      throw new Error("No CSV data provided.");
    }

    // Parse CSV
    const parsed = Papa.parse<Record<string, unknown>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    if (parsed.errors.length > 0) {
      throw new Error(`CSV format error: ${parsed.errors[0]?.message || "Invalid CSV layout."}`);
    }

    // Validate rows
    const validationResult = validateCsvRows(parsed.data);

    if (previewOnly) {
      return {
        preview: true,
        totalRows: parsed.data.length,
        validCount: validationResult.validRows.length,
        errorCount: validationResult.errors.length,
        errors: validationResult.errors,
        sampleRows: validationResult.validRows.slice(0, 5),
      };
    }

    if (confirm) {
      if (validationResult.errors.length > 0) {
        throw new Error(
          `Cannot import: CSV contains ${validationResult.errors.length} invalid rows. Please resolve all row errors before importing.`
        );
      }

      // Load all categories for fast mapping
      const allCategories = await prisma.category.findMany();
      const categoryMap = new Map<string, string>();
      allCategories.forEach((c) => categoryMap.set(c.name.toLowerCase(), c.id));

      // Execute upsert in a single transaction
      await prisma.$transaction(async (tx) => {
        for (const row of validationResult.validRows) {
          let categoryId = categoryMap.get(row.categoryName.toLowerCase());

          // Create category if it doesn't exist
          if (!categoryId) {
            const baseSlug = row.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            const newCat = await tx.category.create({
              data: {
                name: row.categoryName,
                slug: `${baseSlug}-${Date.now().toString(36)}`,
              },
            });
            categoryId = newCat.id;
            categoryMap.set(row.categoryName.toLowerCase(), categoryId);
          }

          const slug = `${row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${row.sku.toLowerCase()}`;

          await tx.product.upsert({
            where: { sku: row.sku },
            create: {
              sku: row.sku,
              name: row.name,
              slug,
              categoryId,
              packSize: row.packSize,
              unit: row.unit,
              mrpPaise: row.mrpPaise,
              pricePaise: row.pricePaise,
              availability: row.availability,
              isFeatured: row.isFeatured,
              isBestseller: row.isBestseller,
              shortDesc: row.shortDesc || null,
              version: 1,
            },
            update: {
              name: row.name,
              categoryId,
              packSize: row.packSize,
              unit: row.unit,
              mrpPaise: row.mrpPaise,
              pricePaise: row.pricePaise,
              availability: row.availability,
              isFeatured: row.isFeatured,
              isBestseller: row.isBestseller,
              shortDesc: row.shortDesc || null,
              version: { increment: 1 },
            },
          });
        }

        // Audit log
        await tx.auditLog.create({
          data: {
            actorId: session.user.id,
            action: "CSV_IMPORT",
            entity: "Product",
            entityId: "bulk",
            afterData: { importedCount: validationResult.validRows.length },
          },
        });
      });

      revalidateTag("products");
      revalidateTag("categories");

      return {
        success: true,
        importedCount: validationResult.validRows.length,
        message: `Successfully imported ${validationResult.validRows.length} products.`,
      };
    }

    throw new Error("Specify either previewOnly or confirm.");
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
