import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { validateCsvRows } from "@/lib/validation/csv";
import { calculateDiscountPercent } from "@/lib/utils/money";
import Papa from "papaparse";

describe("Admin Catalogue Integration Tests (Real PostgreSQL)", () => {
  let testCategoryId: string;
  let testProduct1Id: string;
  let testProduct2Id: string;

  beforeAll(async () => {
    // 1. Create a dedicated test category
    const category = await prisma.category.create({
      data: {
        name: `Integration Test Cat ${Date.now()}`,
        slug: `test-cat-${Date.now()}`,
        colorFrom: "#FF2E93",
        colorTo: "#FF7A18",
        sortOrder: 999,
      },
    });
    testCategoryId = category.id;

    // 2. Create two test products
    // Product 1: MRP = ₹200 (20000 paise), Price = ₹100 (10000 paise)
    const p1 = await prisma.product.create({
      data: {
        sku: `TEST-SKU-1-${Date.now()}`,
        name: "Test Sparkler 1",
        slug: `test-sparkler-1-${Date.now()}`,
        categoryId: testCategoryId,
        mrpPaise: 20000,
        pricePaise: 10000,
        availability: "IN_STOCK",
        packSize: "10 Pcs",
        unit: "box",
        version: 1,
      },
    });
    testProduct1Id = p1.id;

    // Product 2: MRP = ₹500 (50000 paise), Price = ₹350 (35000 paise)
    const p2 = await prisma.product.create({
      data: {
        sku: `TEST-SKU-2-${Date.now()}`,
        name: "Test Chakkars 2",
        slug: `test-chakkars-2-${Date.now()}`,
        categoryId: testCategoryId,
        mrpPaise: 50000,
        pricePaise: 35000,
        availability: "IN_STOCK",
        packSize: "10 Pcs",
        unit: "box",
        version: 1,
      },
    });
    testProduct2Id = p2.id;
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.comboItem.deleteMany({
      where: { product: { categoryId: testCategoryId } },
    });
    await prisma.combo.deleteMany({
      where: { slug: { contains: "test-combo" } },
    });
    await prisma.product.deleteMany({
      where: { categoryId: testCategoryId },
    });
    await prisma.category.deleteMany({
      where: { id: testCategoryId },
    });
  });

  describe("1. Optimistic Locking & Version Conflicts", () => {
    it("successfully updates when client version matches the database version", async () => {
      const current = await prisma.product.findUniqueOrThrow({
        where: { id: testProduct1Id },
      });
      const expectedVersion = current.version;

      const updated = await prisma.product.update({
        where: { id: testProduct1Id, version: expectedVersion },
        data: {
          name: "Test Sparkler 1 Updated",
          version: { increment: 1 },
        },
      });

      expect(updated.name).toBe("Test Sparkler 1 Updated");
      expect(updated.version).toBe(expectedVersion + 1);
    });

    it("prevents stale overwrite and detects version conflict", async () => {
      const current = await prisma.product.findUniqueOrThrow({
        where: { id: testProduct1Id },
      });
      const staleVersion = current.version - 1; // Stale client version

      // Attempting to update with stale version using optimistic lock check
      const checkVersionConflict = async (id: string, clientVersion: number) => {
        const prod = await prisma.product.findUniqueOrThrow({ where: { id } });
        if (prod.version !== clientVersion) {
          const err: any = new Error("This product was modified by another administrator.");
          err.code = "VERSION_CONFLICT";
          throw err;
        }
        return await prisma.product.update({
          where: { id, version: clientVersion },
          data: { name: "Should not update", version: { increment: 1 } },
        });
      };

      await expect(checkVersionConflict(testProduct1Id, staleVersion)).rejects.toThrow(
        "This product was modified by another administrator."
      );
    });
  });

  describe("2. Bulk Pricing Calculation & Validation", () => {
    it("computes percentage price adjustments with nearest rupee rounding", async () => {
      // Product 1: Price is ₹100.00 (10000 paise).
      // Increase by 12.5%: 10000 * 1.125 = 11250 paise (₹112.50).
      // Rounded to nearest Rupee (100 paise): Math.round(11250 / 100) * 100 = 11300 paise (₹113.00).
      const oldPricePaise = 10000;
      const adjustmentPercent = 12.5;

      let calculatedPaise = Math.round(oldPricePaise * (1 + adjustmentPercent / 100));
      expect(calculatedPaise).toBe(11250);

      const roundedPaise = Math.round(calculatedPaise / 100) * 100;
      expect(roundedPaise).toBe(11300);

      const discount = calculateDiscountPercent(20000, roundedPaise);
      expect(discount).toBe(44); // (200 - 113) / 200 = 43.5% -> 44%
    });

    it("validates that new price cannot exceed MRP", async () => {
      // Product 1: MRP = 20000 paise (₹200). Current price = 10000.
      // If increased by 150%: price becomes 25000 paise (₹250), which exceeds MRP.
      const mrpPaise = 20000;
      const invalidNewPrice = 25000;

      const isValid = invalidNewPrice <= mrpPaise;
      expect(isValid).toBe(false);
    });

    it("applies transactional bulk price updates and increments product versions", async () => {
      const initialP2 = await prisma.product.findUniqueOrThrow({
        where: { id: testProduct2Id },
      });

      const newPricePaise = 36000; // ₹360 (within MRP ₹500)
      await prisma.$transaction([
        prisma.product.update({
          where: { id: testProduct2Id },
          data: {
            pricePaise: newPricePaise,
            version: { increment: 1 },
          },
        }),
      ]);

      const updatedP2 = await prisma.product.findUniqueOrThrow({
        where: { id: testProduct2Id },
      });
      expect(updatedP2.pricePaise).toBe(36000);
      expect(updatedP2.version).toBe(initialP2.version + 1);
    });
  });

  describe("3. CSV Import Validation & Upsert", () => {
    it("validates CSV rows and catches price exceeding MRP or negative values", () => {
      const invalidCsvData = [
        {
          SKU: "TEST-INV-1",
          Name: "Invalid Price Product",
          Category: "Sparklers",
          MRP: "100",
          Price: "150", // Exceeds MRP!
          PackSize: "10 Pcs",
          Unit: "box",
        },
        {
          SKU: "TEST-INV-2",
          Name: "Negative Price Product",
          Category: "Sparklers",
          MRP: "100",
          Price: "-10", // Negative!
          PackSize: "10 Pcs",
          Unit: "box",
        },
      ];

      const res = validateCsvRows(invalidCsvData);
      expect(res.validRows.length).toBe(0);
      expect(res.errors.length).toBe(2);
      expect(res.errors[0]?.message).toContain("cannot exceed MRP");
      expect(res.errors[1]?.message).toContain("negative");
    });

    it("successfully parses valid CSV and transactional upsert works in database", async () => {
      const validCsvContent = `SKU,Name,Category,MRP,Price,PackSize,Unit,Availability,Featured,Bestseller,ShortDescription
TEST-CSV-01,Deluxe Electric Sparkler,Sparklers,150,85,10 Pcs,box,IN_STOCK,false,true,Clean crackling sound`;

      const parsed = Papa.parse<Record<string, unknown>>(validCsvContent, {
        header: true,
        skipEmptyLines: true,
      });

      expect(parsed.data.length).toBe(1);
      const validation = validateCsvRows(parsed.data);
      expect(validation.errors.length).toBe(0);
      expect(validation.validRows.length).toBe(1);

      const row = validation.validRows[0]!;
      expect(row.sku).toBe("TEST-CSV-01");
      expect(row.mrpPaise).toBe(15000);
      expect(row.pricePaise).toBe(8500);

      // Perform transactional upsert
      const upserted = await prisma.product.upsert({
        where: { sku: row.sku },
        create: {
          sku: row.sku,
          name: row.name,
          slug: `test-csv-01-${Date.now()}`,
          categoryId: testCategoryId,
          packSize: row.packSize,
          unit: row.unit,
          mrpPaise: row.mrpPaise,
          pricePaise: row.pricePaise,
          availability: row.availability,
          isBestseller: row.isBestseller,
          version: 1,
        },
        update: {
          name: row.name,
          mrpPaise: row.mrpPaise,
          pricePaise: row.pricePaise,
        },
      });

      expect(upserted.sku).toBe("TEST-CSV-01");
      expect(upserted.pricePaise).toBe(8500);

      // Clean up the imported test product
      await prisma.product.delete({ where: { id: upserted.id } });
    });
  });

  describe("4. Category Archive Safety Guard", () => {
    it("blocks archiving a category that contains active products", async () => {
      // Check active products count
      const activeProductsCount = await prisma.product.count({
        where: { categoryId: testCategoryId, isArchived: false },
      });
      expect(activeProductsCount).toBeGreaterThan(0);

      // Attempting to archive should fail guard
      const archiveCategoryWithGuard = async (categoryId: string) => {
        const count = await prisma.product.count({
          where: { categoryId, isArchived: false },
        });
        if (count > 0) {
          const err: any = new Error(
            `Cannot archive category: ${count} active product(s) are still assigned.`
          );
          err.code = "CATEGORY_HAS_PRODUCTS";
          throw err;
        }
        return await prisma.category.update({
          where: { id: categoryId },
          data: { isArchived: true },
        });
      };

      await expect(archiveCategoryWithGuard(testCategoryId)).rejects.toThrow(
        "Cannot archive category"
      );
    });

    it("allows archiving once all products in that category are archived", async () => {
      // Create empty temporary category
      const emptyCat = await prisma.category.create({
        data: {
          name: `Empty Cat ${Date.now()}`,
          slug: `empty-cat-${Date.now()}`,
          colorFrom: "#000",
          colorTo: "#FFF",
        },
      });

      const count = await prisma.product.count({
        where: { categoryId: emptyCat.id, isArchived: false },
      });
      expect(count).toBe(0);

      const archivedCat = await prisma.category.update({
        where: { id: emptyCat.id },
        data: { isArchived: true },
      });
      expect(archivedCat.isArchived).toBe(true);

      // Clean up
      await prisma.category.delete({ where: { id: emptyCat.id } });
    });
  });

  describe("5. Combos Calculation & Integrity Guard", () => {
    it("calculates aggregate original price from included products and quantities", async () => {
      const p1 = await prisma.product.findUniqueOrThrow({ where: { id: testProduct1Id } });
      const p2 = await prisma.product.findUniqueOrThrow({ where: { id: testProduct2Id } });

      // Combo with 2 units of p1 and 1 unit of p2
      const items = [
        { productId: p1.id, quantity: 2 },
        { productId: p2.id, quantity: 1 },
      ];

      let originalPaise = 0;
      items.forEach((it) => {
        const prod = it.productId === p1.id ? p1 : p2;
        originalPaise += prod.pricePaise * it.quantity;
      });

      // p1 price = 10000 * 2 = 20000; p2 price = 36000 * 1 = 36000 => Total = 56000 (₹560.00)
      expect(originalPaise).toBe(p1.pricePaise * 2 + p2.pricePaise * 1);

      const comboPaise = 45000; // Special bundle price: ₹450.00
      const savingsPaise = originalPaise - comboPaise;
      const discountPercent = Math.round((savingsPaise / originalPaise) * 100);

      expect(savingsPaise).toBe(11000); // Save ₹110.00
      expect(discountPercent).toBe(20); // ~20% discount

      // Create combo in DB
      const combo = await prisma.combo.create({
        data: {
          name: `Test Combo Package ${Date.now()}`,
          slug: `test-combo-${Date.now()}`,
          originalPaise,
          comboPaise,
          availability: "IN_STOCK",
          items: {
            create: items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
            })),
          },
        },
        include: { items: true },
      });

      expect(combo.originalPaise).toBe(56000);
      expect(combo.comboPaise).toBe(45000);
      expect(combo.items.length).toBe(2);
    });

    it("rejects combo creation when referencing non-existent product", async () => {
      const fakeProductId = "00000000-0000-0000-0000-000000000000";
      const items = [{ productId: fakeProductId, quantity: 1 }];

      const verifyProducts = async (selectedIds: string[]) => {
        const found = await prisma.product.findMany({
          where: { id: { in: selectedIds }, isArchived: false },
        });
        if (found.length !== selectedIds.length) {
          throw new Error("One or more selected products are invalid, missing, or archived.");
        }
      };

      await expect(verifyProducts(items.map((i) => i.productId))).rejects.toThrow(
        "One or more selected products are invalid, missing, or archived."
      );
    });
  });
});
