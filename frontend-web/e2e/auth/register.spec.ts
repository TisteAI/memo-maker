import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    // Check form elements are present
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/^email$/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    // Submit empty form
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/email.*required/i)).toBeVisible();
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Test123!');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('should show error for weak password', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Different123!');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('should successfully register new user', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Test123!');

    await page.click('button[type="submit"]');

    // Should redirect to memos page after successful registration
    await page.waitForURL('/memos', { timeout: 10000 });
    await expect(page).toHaveURL('/memos');
  });

  test('should navigate to login page from register', async ({ page }) => {
    await page.click('text=Sign in');
    await expect(page).toHaveURL('/login');
  });

  test('should have accessible form', async ({ page }) => {
    // Check for proper labels
    const nameInput = page.getByLabel(/full name/i);
    const emailInput = page.getByLabel(/^email$/i);
    const passwordInput = page.getByLabel(/^password$/i);

    await expect(nameInput).toHaveAttribute('type', 'text');
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Check for autocomplete attributes
    await expect(nameInput).toHaveAttribute('autocomplete', 'name');
    await expect(emailInput).toHaveAttribute('autocomplete', 'email');
  });
});
