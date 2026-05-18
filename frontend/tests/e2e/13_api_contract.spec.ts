// tests/e2e/13_api_contract.spec.ts
// API contract tests (run against live backend).
import { test, expect, request as apiRequest } from '@playwright/test';

const API = 'http://localhost:8000';

test.describe('API contract', () => {
  test('GET /health returns ok', async ({ request }) => {
    const resp = await request.get(`${API}/health`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.status).toBe('ok');
  });

  test('GET /health/detailed has expected fields', async ({ request }) => {
    const resp = await request.get(`${API}/health/detailed`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('providers');
    expect(body).toHaveProperty('cache');
  });

  test('GET /api/providers/ returns list', async ({ request }) => {
    const resp = await request.get(`${API}/api/providers/`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body.providers)).toBeTruthy();
  });

  test('GET /v1/models returns list', async ({ request }) => {
    const resp = await request.get(`${API}/v1/models`);
    expect(resp.status()).toBe(200);
    expect((await resp.json()).object).toBe('list');
  });

  test('POST /api/documents/upload with no data returns 400', async ({ request }) => {
    const resp = await request.post(`${API}/api/documents/upload`);
    expect(resp.status()).toBe(400);
  });

  test('POST /api/chat/ with empty message returns 400', async ({ request }) => {
    const resp = await request.post(`${API}/api/chat/`, {
      data: { document_id: 'test', message: '', history: '[]' },
    });
    expect([400, 422]).toContain(resp.status());
  });

  test('Response includes X-Request-ID header', async ({ request }) => {
    const resp = await request.get(`${API}/health`);
    expect(resp.headers()['x-request-id']).toBeTruthy();
  });

  test('Response includes security headers', async ({ request }) => {
    const resp = await request.get(`${API}/health`);
    expect(resp.headers()['x-content-type-options']).toBe('nosniff');
    expect(resp.headers()['x-frame-options']).toBe('DENY');
  });
});
