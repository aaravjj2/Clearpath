// tests/e2e/05_accessibility.spec.ts
// Accessibility checks for key pages.
import { test, expect } from '@playwright/test';

test.describe('Accessibility checks', () => {
  test('home page has no missing alt text on images', async ({ page }) => {
    await page.goto('/');
    const imgs = await page.locator('img').all();
    for (const img of imgs) {
      const alt = await img.getAttribute('alt');
      expect(alt, 'img missing alt attribute').not.toBeNull();
    }
  });

  test('home page has a main landmark', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
  });

  test('all buttons have accessible names', async ({ page }) => {
    await page.goto('/');
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const label =
        (await btn.getAttribute('aria-label')) ||
        (await btn.textContent()) ||
        (await btn.getAttribute('title')) || '';
      expect(label.trim(), 'Button missing accessible name').not.toBe('');
    }
  });

  test('text area has label or aria-label', async ({ page }) => {
    await page.goto('/');
    const textareas = await page.locator('textarea').all();
    for (const ta of textareas) {
      const ariaLabel = await ta.getAttribute('aria-label');
      const id = await ta.getAttribute('id');
      let hasLabel = !!ariaLabel;
      if (!hasLabel && id) {
        const label = page.locator(`label[for="${id}"]`);
        hasLabel = (await label.count()) > 0;
      }
      expect(hasLabel, 'Textarea missing accessible label').toBe(true);
    }
  });

  test('page has a descriptive title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.trim()).not.toBe('');
    expect(title.length).toBeGreaterThan(3);
  });

  test('language is set on html element', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });
});
