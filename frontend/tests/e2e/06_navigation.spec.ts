// tests/e2e/06_navigation.spec.ts
// Navigation flow tests.
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('home page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    expect(errors.filter(e => !e.includes('hydration'))).toHaveLength(0);
  });

  test('unknown route shows 404', async ({ page }) => {
    const resp = await page.goto('/does-not-exist');
    // Next.js returns 404 for unknown routes
    expect(resp?.status()).toBe(404);
  });

  test('home page has logo/brand text', async ({ page }) => {
    await page.goto('/');
    const brand = page.locator('text=ClearPath').first();
    await expect(brand).toBeVisible();
  });

  test('home page shows upload options', async ({ page }) => {
    await page.goto('/');
    // At least one of PDF upload or text paste should be visible
    const uploadSection = page.locator('[data-testid="upload-zone"], [data-testid="upload-section"], .upload, textarea').first();
    await expect(uploadSection).toBeVisible();
  });
});
