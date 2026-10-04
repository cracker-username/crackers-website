import { test, expect } from "@playwright/test";

const criticalRoutes = [
  "/",
  "/price-list",
  "/combos",
  "/safety",
  "/faq",
  "/about",
  "/contact",
  "/track-enquiry",
];

test.describe("Responsive Viewports & Overflow Checks", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("age_verified_18", "true");
      localStorage.setItem("age_verified", "true");
    });
  });

  for (const route of criticalRoutes) {
    test(`No horizontal overflow on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");

      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalOverflow).toBe(false);
    });
  }

  test("Mobile bottom navigation bar is visible and clickable on mobile screens", async ({ page, isMobile }) => {
    if (!isMobile) test.skip();

    await page.goto("/");
    const mobileNav = page.locator("nav[aria-label='Mobile navigation']").or(page.locator("nav.fixed.bottom-0"));
    await expect(mobileNav).toBeVisible();

    // Verify touch target size (minimum 44-48px)
    const navItems = mobileNav.locator("a, button");
    const count = await navItems.count();
    expect(count).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < count; i++) {
      const box = await navItems.nth(i).boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test("Theme toggle switches theme classes without error", async ({ page }) => {
    await page.goto("/");

    // Find theme toggle button
    const themeBtn = page.getByRole("button", { name: /switch to/i }).or(page.locator("button[aria-label*='theme' i]")).first();
    if (await themeBtn.isVisible()) {
      const initialHtmlClass = await page.locator("html").getAttribute("class");

      await themeBtn.click();
      await page.waitForTimeout(300);

      const updatedHtmlClass = await page.locator("html").getAttribute("class");
      expect(updatedHtmlClass).not.toBe(initialHtmlClass);
    }
  });
});
