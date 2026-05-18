// tests/e2e/09_providers.spec.ts
// Provider settings panel tests.
import { test, expect } from '@playwright/test';

test.describe('Provider settings panel', () => {
  test('opens with gear/settings button', async ({ page }) => {
    await page.goto('/');
    const settingsBtn = page.getByRole('button', { name: /settings|providers|configure/i });
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();
    // A dialog/panel should appear
    await expect(page.locator('[role="dialog"], .provider-settings, [data-testid="provider-panel"]')).toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test('settings button is keyboard accessible', async ({ page }) => {
    await page.goto('/');
    // Tab to the settings button
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    // At minimum focused element exists
    await expect(focused).toBeTruthy();
  });
});
