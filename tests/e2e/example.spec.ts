import { test, expect } from '@playwright/test';

test('loads the customer QR landing page', async ({ page }) => {
  await page.goto('/table/testpizza-table-1');

  await expect(page.getByRole('heading', { name: 'TestPizza' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start table session' })).toBeVisible();
});

test('renders the application not-found boundary', async ({ page }) => {
  await page.goto('/route-that-does-not-exist');

  await expect(page.getByText(/not found/i)).toBeVisible();
});
