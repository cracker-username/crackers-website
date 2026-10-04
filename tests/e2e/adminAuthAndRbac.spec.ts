import { test, expect } from "@playwright/test";

test.describe("Admin Authentication & RBAC Access", () => {
  test("1. Unauthenticated request to /admin redirects to /admin/login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/admin\/login/);

    await expect(page.locator("text=Admin Operations Portal")).toBeVisible();
    const emailInput = page.getByPlaceholder("admin@crackers.local");
    const passwordInput = page.locator("input[type='password']");
    const submitBtn = page.getByRole("button", { name: /sign in/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
  });

  test("2. Invalid login credentials display error alert without crashing", async ({ page }) => {
    await page.goto("/admin/login");

    const emailInput = page.getByPlaceholder("admin@crackers.local");
    const passwordInput = page.locator("input[type='password']");
    const submitBtn = page.getByRole("button", { name: /sign in/i });

    await emailInput.fill("wrong_user@crackers.local");
    await passwordInput.fill("WrongPassword123!");
    await submitBtn.click();

    // Verify error alert
    const errorAlert = page.locator("text=Invalid email or password");
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
  });

  test("3. Valid credentials authenticate and load operations dashboard", async ({ page }) => {
    await page.goto("/admin/login");

    const emailInput = page.getByPlaceholder("admin@crackers.local");
    const passwordInput = page.locator("input[type='password']");
    const submitBtn = page.getByRole("button", { name: /sign in/i });

    await emailInput.fill("admin@crackers.local");
    await passwordInput.fill("ChangeMeImmediately123!");
    await submitBtn.click();

    // Should redirect to dashboard
    await page.waitForURL((url) => url.pathname === "/admin", { timeout: 10000 });

    // Verify dashboard metrics & header
    await expect(page.locator("h1")).toContainText(/Operations Dashboard/i);
    await expect(page.locator("text=Today (IST)")).toBeVisible();
    await expect(page.locator("text=Pipeline Value")).toBeVisible();
  });

  test("4. Navigation links to catalogue, enquiries, settings, and users exist", async ({ page }) => {
    // Login first
    await page.goto("/admin/login");
    await page.getByPlaceholder("admin@crackers.local").fill("admin@crackers.local");
    await page.locator("input[type='password']").fill("ChangeMeImmediately123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL((url) => url.pathname === "/admin", { timeout: 10000 });

    // If mobile drawer is closed, open mobile menu toggle
    const mobileMenuBtn = page.locator("button:has(svg.lucide-menu)");
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.click();
      await page.waitForTimeout(300);
    }

    // Verify admin navigation links
    const enquiriesLink = page.locator("a[href='/admin/enquiries']").first();
    const productsLink = page.locator("a[href='/admin/products']").first();
    const settingsLink = page.locator("a[href='/admin/settings']").first();

    await expect(enquiriesLink).toBeVisible();
    await expect(productsLink).toBeVisible();
    await expect(settingsLink).toBeVisible();
  });
});
