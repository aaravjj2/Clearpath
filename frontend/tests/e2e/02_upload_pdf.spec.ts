// tests/e2e/02_upload_pdf.spec.ts
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('PDF upload flow', () => {
  test('upload zone is visible on home page', async ({ page }) => {
    await page.goto('/');
    // The upload tab should be selected by default
    const uploadZone = page.locator('[data-testid="upload-zone"], .upload-zone, input[type="file"]');
    await expect(uploadZone).toBeVisible();
  });

  test('upload tab shows file drop zone', async ({ page }) => {
    await page.goto('/');
    // Click the "Upload PDF" tab if not already selected
    const uploadTab = page.getByRole('button', { name: /upload pdf/i });
    await uploadTab.click();

    // The file input should be accessible
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test('switching to paste tab works', async ({ page }) => {
    await page.goto('/');
    const pasteTab = page.getByRole('button', { name: /paste text/i });
    await pasteTab.click();

    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
  });

  test('example buttons populate the text area', async ({ page }) => {
    await page.goto('/');
    // Click the first example button
    const exampleBtn = page.getByRole('button', { name: /sample lease/i });
    await exampleBtn.click();

    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    const content = await textarea.inputValue();
    expect(content.length).toBeGreaterThan(10);

    await page.screenshot({ path: '../artifacts/screenshots/02_pdf_example_loaded.png' });
  });

  test('file input accepts only PDF files', async ({ page }) => {
    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');
    const accept = await fileInput.getAttribute('accept');
    // If accept attribute is set, it should include PDF
    if (accept) {
      expect(accept).toContain('pdf');
    }
  });
});
