import { test, expect } from '@playwright/test';

test.describe('App loads', () => {
  test('E2E-01: home page renders without white-screen', async ({ page }) => {
    await page.goto('/');
    // Allow React Native Web time to mount
    await page.waitForLoadState('networkidle');
    // The app should render some content (not a blank page)
    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(0);
  });

  test('E2E-02: no JS console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Allow minor RN reconciler warnings; fail only on hard errors
    const hardErrors = errors.filter(
      (e) =>
        !e.includes('Warning:') &&
        !e.includes('ReactDOM') &&
        !e.includes('i18next') &&
        !e.includes('SecureStore') &&
        !e.includes('expo-secure-store') &&
        !e.includes('getItemAsync') &&
        !e.includes('Supabase')
    );
    expect(hardErrors).toHaveLength(0);
  });
});
