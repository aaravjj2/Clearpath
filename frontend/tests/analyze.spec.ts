import { test, expect, Page } from "@playwright/test";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const DOC_ID = "test-doc-999";

/** A minimal Clause with no red flag */
const cleanClause = {
  id: "clause-1",
  index: 0,
  original_text: "The tenant shall pay rent of $1,000 on the first of each month.",
  simplified_text: "You pay $1,000 rent every month on the 1st.",
  clause_type: "payment",
  key_terms: ["rent", "payment", "monthly"],
  red_flag: null,
};

/** A Clause with a severity-3 red flag */
const redFlagClause = {
  id: "clause-2",
  index: 1,
  original_text: "The landlord may enter the premises at any time without prior notice.",
  simplified_text: "The landlord can enter your home anytime without warning.",
  clause_type: "general",
  key_terms: ["entry", "notice", "premises"],
  red_flag: {
    title: "No-notice entry",
    explanation: "Landlord can enter at any time without telling you.",
    why_it_matters: "Violates your right to quiet enjoyment and privacy.",
    what_to_ask: "Can we require 24-hour advance notice for non-emergency entry?",
    severity: 3,
  },
};

const riskScore = {
  overall: 65,
  categories: [
    { label: "Payment Risk", score: 30, summary: "Standard monthly payment terms." },
    { label: "Privacy Risk", score: 80, summary: "No-notice entry is a significant privacy concern." },
    { label: "Exit Risk", score: 60, summary: "Limited early termination options." },
    { label: "Liability Risk", score: 50, summary: "Moderate liability exposure." },
  ],
};

// ── SSE mock helper ────────────────────────────────────────────────────────────

function sseBody(clauses: object[], risk: object) {
  const events: string[] = [];
  clauses.forEach((clause, i) => {
    events.push(
      `data: ${JSON.stringify({
        type: "clause",
        clause,
        progress: (i + 1) / clauses.length,
      })}\n\n`
    );
  });
  events.push(`data: ${JSON.stringify({ type: "risk_score", risk_score: risk })}\n\n`);
  events.push(`data: ${JSON.stringify({ type: "complete" })}\n\n`);
  return events.join("");
}

async function mockStream(page: Page, clauses: object[], risk = riskScore) {
  await page.route(`**/api/documents/${DOC_ID}/stream`, async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
      body: sseBody(clauses, risk),
    });
  });
}

async function mockStreamSlow(page: Page) {
  await page.route(`**/api/documents/${DOC_ID}/stream`, async (route) => {
    // Delay long enough that the test finishes before analysis completes
    await new Promise((resolve) => setTimeout(resolve, 60_000));
    await route.fulfill({ status: 200, body: "" });
  });
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Analyze page – structure & headings", () => {
  test.beforeEach(async ({ page }) => {
    await mockStream(page, [cleanClause, redFlagClause]);
    await page.goto(`/analyze/${DOC_ID}`);
  });

  test("shows 'Document Analysis' heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Document Analysis/i })).toBeVisible();
  });

  test("shows three navigation tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Red Flags/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /All Clauses/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Ask Questions/i })).toBeVisible();
  });

  test("'Red Flags' tab is active by default", async ({ page }) => {
    const rfTab = page.getByRole("button", { name: /Red Flags/i });
    await expect(rfTab).toHaveClass(/bg-slate-800/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Analyze page – streaming & progress", () => {
  test("shows progress bar during analysis", async ({ page }) => {
    await mockStreamSlow(page);
    await page.goto(`/analyze/${DOC_ID}`);
    // Progress bar container is present before completion
    const progressContainer = page.locator(".h-1\\.5.bg-slate-800");
    await expect(progressContainer.first()).toBeVisible();
  });

  test("shows 'Analyzing…' status text during streaming", async ({ page }) => {
    await mockStreamSlow(page);
    await page.goto(`/analyze/${DOC_ID}`);
    await expect(page.getByText(/Analyzing/)).toBeVisible();
  });

  test("shows '2 clauses analyzed' when streaming completes", async ({ page }) => {
    await mockStream(page, [cleanClause, redFlagClause]);
    await page.goto(`/analyze/${DOC_ID}`);
    await expect(page.getByText("2 clauses analyzed")).toBeVisible({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Analyze page – Red Flags tab", () => {
  test("shows red-flagged clause card on Red Flags tab", async ({ page }) => {
    await mockStream(page, [cleanClause, redFlagClause]);
    await page.goto(`/analyze/${DOC_ID}`);
    await expect(page.getByText("2 clauses analyzed")).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByText("The landlord can enter your home anytime without warning.")
    ).toBeVisible();
  });

  test("red flag badge count updates to 1 after streaming", async ({ page }) => {
    await mockStream(page, [cleanClause, redFlagClause]);
    await page.goto(`/analyze/${DOC_ID}`);
    await expect(page.getByText("2 clauses analyzed")).toBeVisible({ timeout: 10_000 });

    const rfBadge = page.locator("button").filter({ hasText: /Red Flags/ }).locator("span").last();
    await expect(rfBadge).toHaveText("1");
  });

  test("shows 'No red flags detected' when there are none", async ({ page }) => {
    await mockStream(page, [cleanClause]);
    await page.goto(`/analyze/${DOC_ID}`);
    await expect(page.getByText("1 clauses analyzed")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("No red flags detected")).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Analyze page – All Clauses tab", () => {
  test.beforeEach(async ({ page }) => {
    await mockStream(page, [cleanClause, redFlagClause]);
    await page.goto(`/analyze/${DOC_ID}`);
    await expect(page.getByText("2 clauses analyzed")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /All Clauses/i }).click();
  });

  test("shows all clause simplified texts", async ({ page }) => {
    await expect(page.getByText("You pay $1,000 rent every month on the 1st.")).toBeVisible();
    await expect(
      page.getByText("The landlord can enter your home anytime without warning.")
    ).toBeVisible();
  });

  test("clause badge count is 2", async ({ page }) => {
    const clausesBadge = page
      .getByRole("button", { name: /All Clauses/ })
      .locator("span")
      .last();
    await expect(clausesBadge).toHaveText("2");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Analyze page – ClauseCard expansion", () => {
  test.beforeEach(async ({ page }) => {
    await mockStream(page, [cleanClause, redFlagClause]);
    await page.goto(`/analyze/${DOC_ID}`);
    await expect(page.getByText("2 clauses analyzed")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /All Clauses/i }).click();
  });

  test("original text is hidden before expanding clause", async ({ page }) => {
    await expect(
      page.getByText("The tenant shall pay rent of $1,000 on the first of each month.")
    ).not.toBeVisible();
  });

  test("clicking a clause card reveals original text", async ({ page }) => {
    // Click the simplified text — event bubbles up to the <button> wrapper
    await page.getByText("You pay $1,000 rent every month on the 1st.").click();
    await expect(
      page.getByText("The tenant shall pay rent of $1,000 on the first of each month.")
    ).toBeVisible();
  });

  test("expanded red-flag clause shows 'Why it matters' detail", async ({ page }) => {
    await page.getByText("The landlord can enter your home anytime without warning.").click();
    await expect(page.getByText("Violates your right to quiet enjoyment and privacy.")).toBeVisible();
  });

  test("expanded red-flag clause shows 'Ask:' suggestion", async ({ page }) => {
    await page.getByText("The landlord can enter your home anytime without warning.").click();
    await expect(
      page.getByText("Can we require 24-hour advance notice for non-emergency entry?")
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Analyze page – Risk breakdown panel", () => {
  test.beforeEach(async ({ page }) => {
    await mockStream(page, [cleanClause, redFlagClause]);
    await page.goto(`/analyze/${DOC_ID}`);
    await expect(page.getByText("2 clauses analyzed")).toBeVisible({ timeout: 10_000 });
  });

  test("shows Risk Breakdown section title", async ({ page }) => {
    await expect(page.getByText("Risk Breakdown")).toBeVisible();
  });

  test("shows all four risk categories", async ({ page }) => {
    await expect(page.getByText("Payment Risk")).toBeVisible();
    await expect(page.getByText("Privacy Risk")).toBeVisible();
    await expect(page.getByText("Exit Risk")).toBeVisible();
    await expect(page.getByText("Liability Risk")).toBeVisible();
  });

  test("shows correct numeric scores for categories", async ({ page }) => {
    await expect(page.getByText("30/100")).toBeVisible(); // Payment Risk
    await expect(page.getByText("80/100")).toBeVisible(); // Privacy Risk
  });

  test("shows category summaries", async ({ page }) => {
    await expect(page.getByText("Standard monthly payment terms.")).toBeVisible();
    await expect(page.getByText("No-notice entry is a significant privacy concern.")).toBeVisible();
  });

  test("RiskGauge shows overall score as '65/100'", async ({ page }) => {
    // RiskGauge renders `{score}/100` in the header area
    await expect(page.getByText("65/100").first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Analyze page – Chat panel", () => {
  test("chat panel shows 'Analysis still in progress' when streaming", async ({ page }) => {
    await mockStreamSlow(page);
    await page.goto(`/analyze/${DOC_ID}`);
    await page.getByRole("button", { name: /Ask Questions/i }).click();
    await expect(
      page.getByText("Analysis still in progress. Chat available when complete.")
    ).toBeVisible();
  });

  test("chat input is disabled while analysis is running", async ({ page }) => {
    await mockStreamSlow(page);
    await page.goto(`/analyze/${DOC_ID}`);
    await page.getByRole("button", { name: /Ask Questions/i }).click();
    await expect(page.getByPlaceholder("Ask about your document…")).toBeDisabled();
  });

  test("chat panel is enabled and shows prompt after analysis completes", async ({ page }) => {
    await mockStream(page, [cleanClause, redFlagClause]);
    await page.goto(`/analyze/${DOC_ID}`);
    await expect(page.getByText("2 clauses analyzed")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Ask Questions/i }).click();
    await expect(page.getByPlaceholder("Ask about your document…")).toBeEnabled();
    await expect(page.getByText("Ask anything about your document.")).toBeVisible();
  });

  test("send button is disabled when chat input is empty", async ({ page }) => {
    await mockStream(page, [cleanClause, redFlagClause]);
    await page.goto(`/analyze/${DOC_ID}`);
    await expect(page.getByText("2 clauses analyzed")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Ask Questions/i }).click();
    // Send button should be disabled when input is empty
    const sendBtn = page.locator("button").filter({ has: page.locator('svg[class*="lucide-send"], .lucide-send') }).last();
    await expect(sendBtn).toBeDisabled();
  });

  test("chat submit sends a question and shows a reply", async ({ page }) => {
    await mockStream(page, [cleanClause, redFlagClause]);
    await page.route("**/api/chat/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          answer:
            "You are required to pay $1,000 on the first of each month. 📌 Source: Payment clause",
          cited_clause_id: "clause-1",
        }),
      });
    });

    await page.goto(`/analyze/${DOC_ID}`);
    await expect(page.getByText("2 clauses analyzed")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Ask Questions/i }).click();

    await page.getByPlaceholder("Ask about your document…").fill("What are the payment terms?");
    await page.keyboard.press("Enter");

    await expect(page.getByText("What are the payment terms?")).toBeVisible();
    await expect(
      page.getByText("You are required to pay $1,000 on the first of each month.")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("chat shows error message when API call fails", async ({ page }) => {
    await mockStream(page, [cleanClause, redFlagClause]);
    await page.route("**/api/chat/", async (route) => {
      await route.fulfill({ status: 500 });
    });

    await page.goto(`/analyze/${DOC_ID}`);
    await expect(page.getByText("2 clauses analyzed")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Ask Questions/i }).click();

    await page.getByPlaceholder("Ask about your document…").fill("What happens if I miss a payment?");
    await page.keyboard.press("Enter");

    await expect(
      page.getByText("Sorry, I couldn't process that question.")
    ).toBeVisible({ timeout: 10_000 });
  });
});
