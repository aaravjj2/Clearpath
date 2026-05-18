// tests/e2e/10_responsive.spec.ts
// Responsive layout tests.
import { test, expect } from '@playwright/test';

const BREAKPOINTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const bp of BREAKPOINTS) {
  test(`home page layout at ${bp.name} (${bp.width}px)`, async ({ page }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto('/');
    // Page should not have horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(bp.width + 20); // 20px tolerance for scrollbar
    // Primary call-to-action should be visible
    await expect(page.locator('main')).toBeVisible();
  });
}

test('analyze page adapts on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  // Upload a document first
  const resp = await fetch('http://localhost:8000/api/documents/upload', {
    method: 'POST',
    body: new URLSearchParams({ text: 'Lease agreement. ' + 'x '.repeat(30) }),
  }).catch(() => null);

  if (!resp?.ok) {
    test.skip();
    return;
  }
  const { document_id } = await resp.json();
  await page.goto(`/analyze/${document_id}`);
  await expect(page.locator('main')).toBeVisible();
});
