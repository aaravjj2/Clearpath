// tests/e2e/05_risk_score.spec.ts
import { test, expect } from '@playwright/test';

const SAMPLE_TEXT = `
AGREEMENT: You waive all rights. Company may change terms at any time.
Arbitration required. No class actions. All fees non-refundable.
`.trim();

test.describe('Risk score display', () => {
  test('risk score is visible after analysis', async ({ page }) => {
    await page.goto('/');
    const textArea = page.locator('textarea, [role="textbox"]').first();
    await textArea.fill(SAMPLE_TEXT);
    await page.getByRole('button', { name: /analyze|upload|submit/i }).click();

    // Risk score container
    const riskScore = page.locator(
      '[data-testid="risk-score"], .risk-score, [aria-label*="risk"]'
    );
    await expect(riskScore).toBeVisible({ timeout: 20_000 });

    await page.screenshot({ path: '../artifacts/screenshots/05_risk_score.png' });
  });
});

// tests/e2e/06_chat.spec.ts
test.describe('Document Q&A chat', () => {
  test('user can ask a question after analysis', async ({ page }) => {
    await page.goto('/');

    // Upload text
    const textArea = page.locator('textarea, [role="textbox"]').first();
    await textArea.fill(SAMPLE_TEXT);
    await page.getByRole('button', { name: /analyze|upload|submit/i }).click();

    // Wait for analysis to finish
    await page.locator('[data-testid="clauses"], .clause, [data-testid="analysis-results"]')
      .waitFor({ timeout: 20_000 });

    // Find chat input
    const chatInput = page.locator('[data-testid="chat-input"], input[placeholder*="question"], input[placeholder*="ask"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    await chatInput.fill('What are the key risks in this document?');
    await page.keyboard.press('Enter');

    // Chat response should appear
    const chatResponse = page.locator('[data-testid="chat-response"], .chat-message, .assistant-message');
    await expect(chatResponse.first()).toBeVisible({ timeout: 20_000 });

    await page.screenshot({ path: '../artifacts/screenshots/06_chat_response.png' });
  });
});
