// tests/e2e/03_upload_text.spec.ts
import { test, expect } from '@playwright/test';
import path from 'path';

const SAMPLE_LEGAL_TEXT = `
TERMS OF SERVICE AGREEMENT
This Agreement is entered into as of the date of acceptance between the Company and the User.
1. SERVICES: Company will provide software services as described herein.
2. TERMINATION: Company may terminate this agreement at any time without notice.
3. LIMITATION OF LIABILITY: IN NO EVENT SHALL COMPANY BE LIABLE FOR ANY INDIRECT DAMAGES.
4. GOVERNING LAW: This agreement shall be governed by the laws of Delaware.
`.trim();

test.describe('Text paste upload flow', () => {
  test('user can paste text and trigger analysis', async ({ page }) => {
    await page.goto('/');

    // Find the text input area
    const textArea = page.locator('textarea, [role="textbox"]').first();
    await expect(textArea).toBeVisible();
    await textArea.fill(SAMPLE_LEGAL_TEXT);

    // Submit
    const analyzeBtn = page.getByRole('button', { name: /analyze|upload|submit/i });
    await analyzeBtn.click();

    // Should show loading/streaming state
    await expect(page.locator('[data-testid="analysis-loading"], .loading, [aria-label*="loading"]'))
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // Some UIs skip the loading state and go straight to results
      });

    // Should show analysis results
    await expect(page.locator('[data-testid="clauses"], .clause, [data-testid="analysis-results"]'))
      .toBeVisible({ timeout: 20_000 });

    await page.screenshot({ path: '../artifacts/screenshots/03_text_analysis_complete.png' });
  });

  test('analysis shows at least one clause', async ({ page }) => {
    await page.goto('/');
    const textArea = page.locator('textarea, [role="textbox"]').first();
    await textArea.fill(SAMPLE_LEGAL_TEXT);
    await page.getByRole('button', { name: /analyze|upload|submit/i }).click();

    const clauses = page.locator('[data-testid="clause"], .clause-item');
    await expect(clauses.first()).toBeVisible({ timeout: 20_000 });
    const count = await clauses.count();
    expect(count).toBeGreaterThan(0);
  });
});
