import { test, expect } from '@playwright/test';

test.describe('User Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.click('button[type="submit"]');

    // Email and password are required
    await expect(page.getByText(/email.*required/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should show authentication error
    await expect(page.getByText(/invalid.*credentials/i)).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // First register a user to ensure they exist
    await page.goto('/register');
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    const password = 'Test123!';

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');

    // Wait for redirect and then logout
    await page.waitForURL('/memos');

    // Click user menu and logout
    await page.click('button:has-text("Test User")');
    await page.click('text=Sign out');

    // Now login with the same credentials
    await page.waitForURL('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Should redirect to memos page
    await page.waitForURL('/memos');
    await expect(page).toHaveURL('/memos');
  });

  test('should redirect to register page', async ({ page }) => {
    await page.click('text=Sign up');
    await expect(page).toHaveURL('/register');
  });

  test('should show loading state during login', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test123!');

    // Click submit and check for loading state
    const submitButton = page.getByRole('button', { name: /sign in/i });
    await submitButton.click();

    // Button should be disabled during loading
    await expect(submitButton).toBeDisabled();
  });

  test('should have accessible form', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    // Check input types
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Check autocomplete
    await expect(emailInput).toHaveAttribute('autocomplete', 'email');
    await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
  });

  test('should remember email in input', async ({ page }) => {
    const email = 'remember@example.com';
    await page.fill('input[type="email"]', email);

    // Value should persist
    await expect(page.locator('input[type="email"]')).toHaveValue(email);
  });
});
