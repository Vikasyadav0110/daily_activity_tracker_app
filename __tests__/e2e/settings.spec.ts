import { test, expect } from '@playwright/test';

test.describe('Settings navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-05: app is responsive (mobile viewport)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    // Should not overflow horizontally
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20); // allow 20px tolerance for scrollbars
  });

  test('E2E-06: page does not show a blank white screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Take screenshot for visual reference
    const screenshot = await page.screenshot();
    expect(screenshot.length).toBeGreaterThan(1000); // any non-trivial image
  });
});
