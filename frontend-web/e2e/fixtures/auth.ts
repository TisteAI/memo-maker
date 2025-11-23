import { test as base } from '@playwright/test';

/**
 * Test fixtures for authenticated user sessions
 */

type AuthFixtures = {
  authenticatedPage: any;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in login credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test123!');

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for navigation to memos page
    await page.waitForURL('/memos', { timeout: 10000 });

    // Use the authenticated page in tests
    await use(page);
  },
});

export { expect } from '@playwright/test';
