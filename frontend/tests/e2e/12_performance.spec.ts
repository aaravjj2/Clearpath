// tests/e2e/12_performance.spec.ts
// Basic performance checks.
import { test, expect } from '@playwright/test';

test.describe('Performance checks', () => {
  test('home page loads in under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);
  });

  test('no JavaScript errors on home page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Filter known harmless hydration errors in dev mode
    const realErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('ReactDOM.render')
    );
    expect(realErrors).toHaveLength(0);
  });

  test('API health check responds quickly', async ({ page, request }) => {
    const start = Date.now();
    const resp = await request.get('http://localhost:8000/health');
    const elapsed = Date.now() - start;
    expect(resp.status()).toBe(200);
    expect(elapsed).toBeLessThan(500);
  });
});
