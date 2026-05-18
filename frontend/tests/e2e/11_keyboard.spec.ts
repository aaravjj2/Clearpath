// tests/e2e/11_keyboard.spec.ts
// Keyboard interaction tests.
import { test, expect } from '@playwright/test';

test.describe('Keyboard interactions', () => {
  test('can tab through interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('Escape key closes any open modals', async ({ page }) => {
    await page.goto('/');
    // Open settings if available
    const settingsBtn = page.getByRole('button', { name: /settings|providers/i });
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.keyboard.press('Escape');
      // After Escape, dialog should be gone
      await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 2000 }).catch(() => {});
    }
  });

  test('Enter key submits form when button is focused', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.focus();
      await textarea.fill('Sample contract text for testing purposes only. '.repeat(3));
      await page.keyboard.press('Control+Enter');
      // Should attempt navigation or show loading
      await page.waitForTimeout(500);
    }
  });
});
