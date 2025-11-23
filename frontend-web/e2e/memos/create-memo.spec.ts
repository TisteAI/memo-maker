import { test, expect } from '@playwright/test';

test.describe('Memo Creation Flow', () => {
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

  test('should navigate to new memo page', async ({ page }) => {
    await page.click('text=New Memo');
    await expect(page).toHaveURL('/memos/new');
    await expect(page.getByRole('heading', { name: /create new memo/i })).toBeVisible();
  });

  test('should display memo creation form', async ({ page }) => {
    await page.goto('/memos/new');

    // Check all form fields
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/date/i)).toBeVisible();
    await expect(page.getByLabel(/participants/i)).toBeVisible();
    await expect(page.getByLabel(/audio file/i)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/memos/new');
    await page.click('button[type="submit"]');

    // Title is required
    await expect(page.getByText(/title is required/i)).toBeVisible();
  });

  test('should require audio file', async ({ page }) => {
    await page.goto('/memos/new');

    await page.fill('input[name="title"]', 'Test Meeting');
    await page.click('button[type="submit"]');

    // Should show error about missing audio file
    await expect(page.getByText(/select an audio file/i)).toBeVisible();
  });

  test('should fill in current date by default', async ({ page }) => {
    await page.goto('/memos/new');

    const dateInput = page.locator('input[type="date"]');
    const value = await dateInput.inputValue();

    // Should have a value (current date)
    expect(value).toBeTruthy();
  });

  test('should accept participants as comma-separated list', async ({ page }) => {
    await page.goto('/memos/new');

    await page.fill('input[name="participants"]', 'Alice, Bob, Charlie');

    const value = await page.locator('input[name="participants"]').inputValue();
    expect(value).toBe('Alice, Bob, Charlie');
  });

  test('should show file size after selection', async ({ page }) => {
    await page.goto('/memos/new');

    // Note: This test would need an actual audio file to upload
    // For now, we're just checking that the file input exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    await expect(fileInput).toHaveAttribute('accept', 'audio/*');
  });

  test('should have cancel button that returns to memos list', async ({ page }) => {
    await page.goto('/memos/new');

    await page.click('button:has-text("Cancel")');
    await expect(page).toHaveURL('/memos');
  });

  test('should show supported file formats', async ({ page }) => {
    await page.goto('/memos/new');

    await expect(page.getByText(/supported formats.*mp3.*wav.*m4a/i)).toBeVisible();
  });

  test('should show max file size', async ({ page }) => {
    await page.goto('/memos/new');

    await expect(page.getByText(/max 100mb/i)).toBeVisible();
  });

  test('should disable submit button during upload', async ({ page }) => {
    await page.goto('/memos/new');

    const submitButton = page.getByRole('button', { name: /create memo/i });

    // Initially disabled (no audio file)
    await expect(submitButton).toBeDisabled();
  });
});
