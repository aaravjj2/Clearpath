// tests/e2e/01_health.spec.ts
import { test, expect } from '@playwright/test';

test('backend health check', async ({ request }) => {
  const response = await request.get('http://localhost:8000/health');
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body).toHaveProperty('status');
});

test('frontend loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/ClearPath/i);
});
