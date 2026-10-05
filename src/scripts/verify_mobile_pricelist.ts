import { chromium } from '@playwright/test';
import * as path from 'path';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: '360px', width: 360, height: 800 },
    { name: '375px', width: 375, height: 812 },
    { name: '390px', width: 390, height: 844 },
    { name: '414px', width: 414, height: 896 },
    { name: '1024px-desktop', width: 1024, height: 768 }
  ];

  const results: any[] = [];
  const artifactDir = 'C:\\Users\\rj901\\.gemini\\antigravity\\brain\\246bc9f3-1c91-4112-b813-8821aa538be8';

  for (const vp of viewports) {
    console.log(`Testing viewport ${vp.name}...`);
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });

    try {
      // Pre-accept age consent so it does not block interactions
      await page.addInitScript(() => {
        localStorage.setItem('age_verified_18', 'true');
      });

      await page.goto('http://localhost:3005/price-list', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000); // Allow react hydration

      // Check horizontal scrollability directly by trying to scroll horizontally
      const scrollCheck = await page.evaluate(() => {
        const initialScrollX = window.scrollX;
        window.scrollTo(500, 0);
        const scrolledX = window.scrollX;
        window.scrollTo(0, 0); // reset back

        const docScrollWidth = document.documentElement.scrollWidth;
        const docClientWidth = document.documentElement.clientWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const bodyClientWidth = document.body.clientWidth;

        return {
          windowInnerWidth: window.innerWidth,
          docClientWidth,
          docScrollWidth,
          bodyClientWidth,
          bodyScrollWidth,
          canScrollHorizontally: scrolledX > 0,
          scrolledX
        };
      });

      const isMobile = vp.width < 1024;
      let detailsExpanded = false;
      let stepperWorked = false;
      let addedToEnquiryFeedback = false;

      if (isMobile) {
        // Expand "View Details" on the first mobile card
        const viewDetailsBtn = page.locator('button:has-text("View Details")').first();
        if (await viewDetailsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await viewDetailsBtn.click();
          await page.waitForTimeout(300);
          detailsExpanded = true;
        }

        // Click "+" on first item
        const plusBtn = page.locator('button[aria-label*="Increase"]').first();
        if (await plusBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await plusBtn.click();
          await page.waitForTimeout(300);
          stepperWorked = true;
        }

        // Click "Add to Enquiry"
        const addBtn = page.locator('button:has-text("Add to Enquiry")').first();
        if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await addBtn.click();
          await page.waitForTimeout(500);
          // Check for "Added to Enquiry" feedback
          addedToEnquiryFeedback = await page.locator('text=Added to Enquiry').isVisible({ timeout: 2000 }).catch(() => false);
        }
      }

      // Check if sticky enquiry bar appears
      const stickyBarVisible = await page.locator('text=Review Enquiry').isVisible({ timeout: 2000 }).catch(() => false);

      const screenshotPath = path.join(artifactDir, `pricelist_${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      results.push({
        viewport: vp.name,
        width: vp.width,
        docClientWidth: scrollCheck.docClientWidth,
        docScrollWidth: scrollCheck.docScrollWidth,
        canScrollHorizontally: scrollCheck.canScrollHorizontally,
        scrolledX: scrollCheck.scrolledX,
        detailsExpanded,
        stepperWorked,
        addedToEnquiryFeedback,
        stickyBarVisible,
        screenshot: screenshotPath
      });
      console.log(`✓ ${vp.name}: width=${vp.width}, clientWidth=${scrollCheck.docClientWidth}, scrollWidth=${scrollCheck.docScrollWidth}, canScrollX=${scrollCheck.canScrollHorizontally}, stepper=${stepperWorked}, feedback=${addedToEnquiryFeedback}, stickyBar=${stickyBarVisible}`);
    } catch (err: any) {
      console.error(`✗ ${vp.name} failed:`, err.message);
      results.push({
        viewport: vp.name,
        error: err.message
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('FINAL_VERIFICATION_RESULTS:', JSON.stringify(results, null, 2));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
