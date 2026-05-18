import { test, expect } from "@playwright/test";

// ── Shared mock ──────────────────────────────────────────────────────────────
async function mockUpload(page: import("@playwright/test").Page, docId = "test-doc-123") {
  await page.route("**/api/documents/upload", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ document_id: docId, filename: "pasted_document.txt" }),
    });
  });
}

async function mockUploadFail(page: import("@playwright/test").Page) {
  await page.route("**/api/documents/upload", async (route) => {
    await route.fulfill({ status: 500, body: "Internal Server Error" });
  });
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Home page – branding & layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows ClearPath logo and name", async ({ page }) => {
    await expect(page.getByText("ClearPath").first()).toBeVisible();
  });

  test("shows hero headline 'Understand what you're signing'", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Understand what you");
    await expect(page.getByText("signing.")).toBeVisible();
  });

  test("shows hero sub-copy", async ({ page }) => {
    await expect(page.getByText("plain-English breakdown")).toBeVisible();
  });

  test("shows the three feature pills", async ({ page }) => {
    await expect(page.getByText("Any document")).toBeVisible();
    await expect(page.getByText("Auto red flags")).toBeVisible();
    await expect(page.getByText("Risk score")).toBeVisible();
  });

  test("shows example document buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Sample Lease Agreement" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Employment Contract" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Freelance Contract" })).toBeVisible();
  });

  test("page title is 'ClearPath'", async ({ page }) => {
    await expect(page).toHaveTitle("ClearPath");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Home page – Upload PDF tab (default)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("'Upload PDF' tab is active by default", async ({ page }) => {
    const uploadTab = page.getByRole("button", { name: "Upload PDF" });
    await expect(uploadTab).toHaveClass(/bg-blue-600/);
  });

  test("upload drop-zone is visible", async ({ page }) => {
    await expect(page.getByText("Drop your PDF here")).toBeVisible();
    await expect(page.getByText("or click to browse")).toBeVisible();
  });

  test("textarea is NOT visible on upload tab", async ({ page }) => {
    await expect(
      page.getByPlaceholder("Paste your contract, lease, or any legal document text here...")
    ).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Home page – Paste Text tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Paste Text" }).click();
  });

  test("switching to Paste Text tab hides the upload zone", async ({ page }) => {
    await expect(page.getByText("Drop your PDF here")).not.toBeVisible();
  });

  test("shows the textarea for pasting", async ({ page }) => {
    await expect(
      page.getByPlaceholder("Paste your contract, lease, or any legal document text here...")
    ).toBeVisible();
  });

  test("'Analyze document' button is disabled when textarea is empty", async ({ page }) => {
    const btn = page.getByRole("button", { name: /Analyze document/i });
    await expect(btn).toBeDisabled();
  });

  test("'Analyze document' button enables when text is entered", async ({ page }) => {
    await page
      .getByPlaceholder("Paste your contract, lease, or any legal document text here...")
      .fill("This is a test contract clause.");
    const btn = page.getByRole("button", { name: /Analyze document/i });
    await expect(btn).toBeEnabled();
  });

  test("'Paste Text' tab is highlighted", async ({ page }) => {
    const pasteTab = page.getByRole("button", { name: "Paste Text" });
    await expect(pasteTab).toHaveClass(/bg-blue-600/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Home page – Tab switching", () => {
  test("can switch back from Paste Text to Upload PDF", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Paste Text" }).click();
    await page.getByRole("button", { name: "Upload PDF" }).click();
    await expect(page.getByText("Drop your PDF here")).toBeVisible();
    await expect(
      page.getByPlaceholder("Paste your contract, lease, or any legal document text here...")
    ).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Home page – Text submission flow", () => {
  test("successful text submit navigates to /analyze/{docId}", async ({ page }) => {
    await mockUpload(page, "doc-abc-123");
    await page.goto("/");
    await page.getByRole("button", { name: "Paste Text" }).click();
    await page
      .getByPlaceholder("Paste your contract, lease, or any legal document text here...")
      .fill("Landlord may enter without notice at any time.");
    await page.getByRole("button", { name: /Analyze document/i }).click();
    await page.waitForURL("**/analyze/doc-abc-123");
    expect(page.url()).toContain("/analyze/doc-abc-123");
  });

  test("shows loading state after submitting", async ({ page }) => {
    // Delay mock so we can catch the loading state
    await page.route("**/api/documents/upload", async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ document_id: "doc-xyz", filename: "pasted_document.txt" }),
      });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Paste Text" }).click();
    await page
      .getByPlaceholder("Paste your contract, lease, or any legal document text here...")
      .fill("Test contract content.");
    await page.getByRole("button", { name: /Analyze document/i }).click();
    await expect(page.getByText("Uploading and preparing analysis...")).toBeVisible();
  });

  test("shows error message when upload fails", async ({ page }) => {
    await mockUploadFail(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Paste Text" }).click();
    await page
      .getByPlaceholder("Paste your contract, lease, or any legal document text here...")
      .fill("Test contract content.");
    await page.getByRole("button", { name: /Analyze document/i }).click();
    await expect(page.getByText("Submission failed. Please try again.")).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Home page – PDF file upload flow", () => {
  test("successful file drop navigates to analyze page", async ({ page }) => {
    await mockUpload(page, "pdf-doc-456");
    await page.goto("/");

    // Simulate file upload by triggering the hidden file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "lease.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 fake pdf content"),
    });

    await page.waitForURL("**/analyze/pdf-doc-456", { timeout: 10_000 });
    expect(page.url()).toContain("/analyze/pdf-doc-456");
  });

  test("shows error message when PDF upload fails", async ({ page }) => {
    await mockUploadFail(page);
    await page.goto("/");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "lease.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 fake pdf content"),
    });

    await expect(page.getByText("Upload failed. Please try again.")).toBeVisible();
  });
});
