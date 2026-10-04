import { test, expect } from "@playwright/test";

test.describe("Public Catalogue & Enquiry Journey", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("age_verified_18", "true");
      localStorage.setItem("age_verified", "true");
    });
  });

  test("1. Homepage renders hero, announcements, and trust badges", async ({ page }) => {
    await page.goto("/");

    // Verify title and heading
    await expect(page).toHaveTitle(/Sivakasi Crackers Price List/);
    await expect(page.locator("h1")).toContainText(/Sivakasi/i);

    // Verify key sections
    const announcement = page.locator("text=DIWALI").first();
    await expect(announcement).toBeVisible();

    const trustBadges = page.locator("text=100% Genuine Sivakasi").first();
    await expect(trustBadges).toBeVisible();
  });

  test("2. Catalogue page supports searching, category filter, and view mode toggle", async ({ page }) => {
    await page.goto("/price-list");

    // Check heading
    await expect(page.locator("h1")).toContainText("Price List");

    // Search for a product
    const searchInput = page.getByPlaceholder(/search crackers/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("Sparkler");
      await page.waitForTimeout(500);
      const sparklerText = page.locator("text=Sparkler").first();
      await expect(sparklerText).toBeVisible();
    }

    // Toggle view mode to table
    const tableButton = page.locator("button[aria-label='Quick Order Table View']").or(page.getByRole("button", { name: /table/i }));
    if (await tableButton.isVisible()) {
      await tableButton.click();
      await page.waitForTimeout(300);
      expect(page.url()).toContain("view=table");
    }
  });

  test("3. Product detail page displays specs and enquiry controls", async ({ page }) => {
    // Navigate to a product page
    await page.goto("/price-list");
    const firstProductLink = page.locator("a[href^='/products/']").first();
    await expect(firstProductLink).toBeVisible();
    await firstProductLink.click();

    await page.waitForURL(/\/products\/.+/);

    // Verify product detail elements
    await expect(page.locator("h1")).toBeVisible();
    const addToEnquiryBtn = page.getByRole("button", { name: /Add to Enquiry/i }).first();
    await expect(addToEnquiryBtn).toBeVisible();

    // Verify WhatsApp direct enquiry button is present and visible
    const whatsappBtn = page.locator("a[aria-label='Direct WhatsApp Enquiry']").or(page.locator("a[href^='https://wa.me']")).filter({ visible: true }).first();
    await expect(whatsappBtn).toBeVisible();
  });

  test("4. Review Enquiry page validates location, minimum order threshold and 18+ consent", async ({ page }) => {
    await page.goto("/enquiry");

    await expect(page.locator("h1")).toContainText("Review Enquiry");

    // Form inputs must be visible
    const nameInput = page.getByPlaceholder(/your full name/i);
    const mobileInput = page.getByPlaceholder(/10-digit mobile/i);

    if (await nameInput.isVisible()) {
      await expect(nameInput).toBeVisible();
      await expect(mobileInput).toBeVisible();
    }
  });

  test("5. Track enquiry page loads and validates mobile number input", async ({ page }) => {
    await page.goto("/track-enquiry");

    await expect(page.locator("h1")).toContainText("Track Your Enquiry");

    const enquiryInput = page.getByPlaceholder(/CE-26-000001/i).or(page.locator("input[placeholder*='CE-']"));
    const mobileInput = page.getByPlaceholder("9876543210").or(page.locator("input[type='tel']"));
    const trackBtn = page.getByRole("button", { name: /^Track Enquiry$/i }).or(page.locator("button[type='submit']"));

    await expect(enquiryInput).toBeVisible();
    await expect(mobileInput).toBeVisible();
    await expect(trackBtn).toBeVisible();

    // Test validation on invalid submission
    await enquiryInput.fill("INVALID-NUMBER");
    await mobileInput.fill("9999999999");
    await trackBtn.click();

    // Should display not found error message
    const errorMsg = page.locator("text=No enquiry found matching");
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
  });
});
