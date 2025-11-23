import { test, expect } from '@playwright/test';

test.describe('Memo List', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/register');
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Test123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('/memos');
  });

  test('should display memos page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /your memos/i })).toBeVisible();
  });

  test('should show empty state when no memos', async ({ page }) => {
    await expect(page.getByText(/no memos found/i)).toBeVisible();
    await expect(page.getByText(/get started by creating your first memo/i)).toBeVisible();
  });

  test('should display filter buttons', async ({ page }) => {
    await expect(page.getByText('Filter:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Completed' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Processing' })).toBeVisible();
  });

  test('should highlight active filter', async ({ page }) => {
    const allButton = page.getByRole('button', { name: 'All' });
    const completedButton = page.getByRole('button', { name: 'Completed' });

    // All should be active by default
    await expect(allButton).toHaveClass(/bg-primary/);

    // Click completed filter
    await completedButton.click();
    await expect(completedButton).toHaveClass(/bg-primary/);
    await expect(allButton).not.toHaveClass(/bg-primary/);
  });

  test('should display New Memo button', async ({ page }) => {
    const newMemoButton = page.getByRole('link', { name: /new memo/i });
    await expect(newMemoButton).toBeVisible();

    await newMemoButton.click();
    await expect(page).toHaveURL('/memos/new');
  });

  test('should show user menu in header', async ({ page }) => {
    await expect(page.getByText('Test User')).toBeVisible();
  });

  test('should logout from user menu', async ({ page }) => {
    // Click user menu
    await page.click('button:has-text("Test User")');

    // Click logout
    await page.click('text=Sign out');

    // Should redirect to login
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });

  test('should protect route when not authenticated', async ({ page, context }) => {
    // Clear cookies to simulate logout
    await context.clearCookies();

    // Try to access memos page
    await page.goto('/memos');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should show Memo Maker branding', async ({ page }) => {
    await expect(page.getByText('Memo Maker')).toBeVisible();
  });

  test('should navigate to home from logo', async ({ page }) => {
    await page.goto('/memos/new');

    await page.click('text=Memo Maker');
    await expect(page).toHaveURL('/memos');
  });
});
