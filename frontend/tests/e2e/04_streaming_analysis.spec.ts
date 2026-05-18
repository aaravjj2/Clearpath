// tests/e2e/04_streaming_analysis.spec.ts
import { test, expect } from '@playwright/test';

const SAMPLE_CONTRACT = `
1. Payment Terms. The client shall pay $5,000 per month, net-30 from invoice date. Late payments incur 2% monthly interest.

2. Termination. Either party may terminate with 30 days written notice. Immediate termination allowed for material breach.

3. Liability Limitation. Contractor's total liability is capped at fees paid in the prior 3 months.

4. Non-Disclosure. Both parties agree to keep confidential all proprietary information for 3 years post-termination.
`.trim();

test.describe('Streaming analysis', () => {
  test('analysis page loads after text submission', async ({ page }) => {
    await page.goto('/');

    // Switch to paste tab
    await page.getByRole('button', { name: /paste text/i }).click();

    const textarea = page.locator('textarea');
    await textarea.fill(SAMPLE_CONTRACT);

    await page.getByRole('button', { name: /analyze/i }).click();

    // Should navigate to analyze page
    await page.waitForURL(/\/analyze\//, { timeout: 10_000 });
    expect(page.url()).toContain('/analyze/');
    await page.screenshot({ path: '../artifacts/screenshots/04_streaming_started.png' });
  });

  test('progress bar appears during streaming', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /paste text/i }).click();
    await page.locator('textarea').fill(SAMPLE_CONTRACT);
    await page.getByRole('button', { name: /analyze/i }).click();

    await page.waitForURL(/\/analyze\//, { timeout: 10_000 });

    // Progress bar or "Analyzing" text should appear
    const progressIndicator = page.locator(
      '[style*="width"], .progress, [aria-label*="progress"], :text-matches("Analyzing", "i")'
    );
    await expect(progressIndicator.first()).toBeVisible({ timeout: 5_000 });
  });

  test('tabs are rendered on analyze page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /paste text/i }).click();
    await page.locator('textarea').fill(SAMPLE_CONTRACT);
    await page.getByRole('button', { name: /analyze/i }).click();

    await page.waitForURL(/\/analyze\//, { timeout: 10_000 });

    // Red Flags, All Clauses, and Ask Questions tabs should exist
    await expect(page.getByRole('button', { name: /red flags/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /all clauses/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /ask questions/i })).toBeVisible({ timeout: 5_000 });

    await page.screenshot({ path: '../artifacts/screenshots/04_analyze_tabs.png' });
  });

  test('stream error banner has role=alert (IMP-003)', async ({ page, context }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /paste text/i }).click();
    await page.locator('textarea').fill(SAMPLE_CONTRACT);

    // Block stream to trigger error
    await context.route('**/stream', route => route.abort());
    await page.getByRole('button', { name: /analyze/i }).click();

    await page.waitForURL(/\/analyze\//, { timeout: 10_000 });
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 10_000 });
  });
});
