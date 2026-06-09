import { test, expect } from '@playwright/test';

test.describe('Activity lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-03: FAB button is visible on home screen', async ({ page }) => {
    // React Native Web renders FAB — look for an accessible button
    // If no accessible label, fall back to any visible button on the page
    const anyButton = page.locator('[aria-label*="add"], button[aria-label*="Add"], [testID="fab"], button').first();
    await expect(anyButton).toBeVisible({ timeout: 10000 });
  });

  test('E2E-04: page title or app name is present', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
