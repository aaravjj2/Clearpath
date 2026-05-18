// tests/e2e/07_error_handling.spec.ts — updated by IMP-003: stream errors shown in UI
import { test, expect } from '@playwright/test';

test.describe('Error handling', () => {
  test('shows error when submitting empty input', async ({ page }) => {
    await page.goto('/');

    // Try to submit with no input
    const analyzeBtn = page.getByRole('button', { name: /analyze|upload|submit/i });
    await analyzeBtn.click();

    // Should show validation error, not crash
    const error = page.locator('[role="alert"], .error-message, [data-testid="error"]');
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('does not crash on very short input', async ({ page }) => {
    await page.goto('/');
    const textArea = page.locator('textarea, [role="textbox"]').first();
    await textArea.fill('hi');
    await page.getByRole('button', { name: /analyze|upload|submit/i }).click();

    // Page should not show an unhandled JS error overlay
    const jsError = page.locator('.next-error-h1, #__next_error__');
    await expect(jsError).not.toBeVisible({ timeout: 5000 });
  });

  test('backend unavailable shows user-friendly message', async ({ page, context }) => {
    // Block all API calls
    await context.route('http://localhost:8000/**', route => route.abort());

    await page.goto('/');
    const textArea = page.locator('textarea, [role="textbox"]').first();
    await textArea.fill('Test contract text here');
    await page.getByRole('button', { name: /analyze|upload|submit/i }).click();

    // Should show a friendly error, not a raw JSON error or blank screen
    const errorMessage = page.locator('[role="alert"], .error, [data-testid="error"]');
    await expect(errorMessage).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: '../artifacts/screenshots/07_network_error.png' });
  });

  test('streaming error is displayed in UI (IMP-003)', async ({ page, context }) => {
    // Upload succeeds but stream endpoint fails
    await page.goto('/');
    const textArea = page.locator('textarea, [role="textbox"]').first();
    await textArea.fill('Test contract text here');

    // Block the stream endpoint to trigger onerror
    await context.route('**/stream', route => route.abort());
    await page.getByRole('button', { name: /analyze|upload|submit/i }).click();

    // The [role="alert"] error banner should appear in the analyze page
    const errorBanner = page.locator('[role="alert"]');
    await expect(errorBanner).toBeVisible({ timeout: 15_000 });
  });
});

// tests/e2e/08_accessibility.spec.ts
test.describe('Accessibility basics', () => {
  test('main page has no critical axe violations', async ({ page }) => {
    await page.goto('/');

    // Inject axe-core
    await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js' });

    const violations = await page.evaluate(async () => {
      // @ts-ignore
      const results = await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a'] },
      });
      return results.violations;
    });

    if (violations.length > 0) {
      console.log('Accessibility violations found:');
      violations.forEach((v: any) => console.log(`  - ${v.id}: ${v.description}`));
    }

    // Critical: no violations with impact 'critical' or 'serious'
    const critical = violations.filter(
      (v: any) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(critical).toHaveLength(0);
  });

  test('file upload button is keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    // At least one interactive element should receive focus
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});
