# End-to-End Testing with Playwright

This directory contains E2E tests for the Memo Maker application using Playwright.

## Overview

The E2E tests cover the complete user journey:
- **Authentication**: Registration and login flows
- **Memo Management**: List, create, view, and filter memos
- **Navigation**: Protected routes, redirects, and user menu
- **Accessibility**: Form labels, ARIA attributes, keyboard navigation

## Test Statistics

- **Total Tests**: 39
- **Test Files**: 4
- **Browsers Tested**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

### Test Coverage

- `auth/register.spec.ts` - 8 tests for user registration
- `auth/login.spec.ts` - 9 tests for user login
- `memos/create-memo.spec.ts` - 11 tests for memo creation
- `memos/memo-list.spec.ts` - 11 tests for memo list and navigation

## Prerequisites

Before running E2E tests, ensure you have:

1. **Backend server running** on `http://localhost:8000`
   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend dev server** (Playwright will start this automatically)
   - Configured to run on port 3000
   - Playwright will start it via `npm run dev` if not already running

3. **Test database** configured in backend
   - Use a separate test database to avoid polluting production data
   - Set `DATABASE_URL` in backend `.env` to point to test database

4. **Required services**:
   - PostgreSQL database
   - Redis (for sessions)
   - OpenAI API key (for memo generation - optional for auth tests)

## Installation

Install Playwright browsers:

```bash
npm run playwright:install
```

This will install Chromium, Firefox, and WebKit browsers with system dependencies.

## Running Tests

### Run all tests (all browsers)

```bash
npm run test:e2e
```

This will run tests in:
- Desktop Chrome
- Desktop Firefox
- Desktop Safari (WebKit)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

### Run tests in UI mode (interactive)

```bash
npm run test:e2e:ui
```

This opens the Playwright UI where you can:
- Run tests individually
- See live browser preview
- Step through tests
- View test traces

### Run tests in debug mode

```bash
npm run test:e2e:debug
```

This runs tests with the Playwright Inspector for debugging.

### Run specific test file

```bash
npx playwright test e2e/auth/login.spec.ts
```

### Run specific test

```bash
npx playwright test e2e/auth/login.spec.ts -g "should successfully login"
```

### Run only on specific browser

```bash
npx playwright test --project=chromium
```

## Test Structure

### Test Fixtures

- `fixtures/auth.ts` - Provides authenticated page fixture for testing protected routes

### Authentication Tests

**Registration Flow** (`auth/register.spec.ts`):
- Form display and validation
- Email format validation
- Password strength requirements
- Password confirmation matching
- Successful registration and auto-login
- Accessibility checks

**Login Flow** (`auth/login.spec.ts`):
- Form display and validation
- Invalid credentials handling
- Successful login
- Loading states
- Navigation between login/register
- Accessibility checks

### Memo Tests

**Create Memo** (`memos/create-memo.spec.ts`):
- Form display
- Required field validation
- Audio file upload requirements
- Default values (current date)
- Participants input
- File format and size limits
- Submit button states
- Cancel navigation

**Memo List** (`memos/memo-list.spec.ts`):
- Page display
- Empty state
- Status filter buttons
- Active filter highlighting
- New Memo button navigation
- User menu and logout
- Route protection (authentication guard)
- Logo navigation

## Writing New Tests

When adding new E2E tests:

1. **Create unique test users**: Use timestamp-based emails to avoid conflicts
   ```typescript
   const email = `test${Date.now()}@example.com`;
   ```

2. **Use semantic selectors**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
   ```typescript
   await page.getByRole('button', { name: /sign in/i })
   await page.getByLabel(/email/i)
   ```

3. **Wait for navigation**: Always wait for URL changes
   ```typescript
   await page.waitForURL('/memos');
   await expect(page).toHaveURL('/memos');
   ```

4. **Use beforeEach for setup**: Register/login in `beforeEach` for consistency
   ```typescript
   test.beforeEach(async ({ page }) => {
     // Setup code
   });
   ```

5. **Test accessibility**: Use ARIA labels and roles
   ```typescript
   await expect(emailInput).toHaveAttribute('autocomplete', 'email');
   ```

## Configuration

The Playwright configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (can be overridden with `BASE_URL` env var)
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Parallel**: Tests run in parallel locally, sequential on CI
- **Traces**: Captured on first retry
- **Screenshots**: Captured on failure
- **Videos**: Retained on failure

## CI/CD Integration

E2E tests run automatically in CI:

1. Backend and database services start
2. Backend runs migrations and starts server
3. Frontend builds and starts
4. Playwright tests run against deployed services
5. Test results and traces uploaded as artifacts

See `.github/workflows/ci.yml` for CI configuration.

## Debugging Failed Tests

### View test traces

After a failed test run:

```bash
npx playwright show-report
```

This shows an HTML report with:
- Test results
- Screenshots
- Videos
- Network logs
- Console logs
- Test traces (timeline of actions)

### Run in headed mode

See the browser while tests run:

```bash
npx playwright test --headed
```

### Slow down execution

```bash
npx playwright test --headed --slow-mo=1000
```

This adds a 1-second delay between actions.

### Check screenshots

Failed test screenshots are saved to:
```
test-results/*/test-failed-*.png
```

## Common Issues

### Backend not running

**Error**: `net::ERR_CONNECTION_REFUSED at http://localhost:8000`

**Solution**: Start the backend server:
```bash
cd ../backend
npm run dev
```

### Port already in use

**Error**: `Error: Port 3000 is already in use`

**Solution**:
- Kill the process using port 3000
- Or set `reuseExistingServer: true` in playwright.config.ts (already enabled)

### Database connection failed

**Error**: `Can't reach database server`

**Solution**: Ensure PostgreSQL is running and `DATABASE_URL` is configured

### Authentication failures in tests

**Error**: Tests fail at login/register steps

**Possible causes**:
- Backend not running
- Database not migrated
- JWT secrets not configured
- CORS issues (check backend CORS settings)

**Debug**: Check backend logs for errors

## Performance Considerations

E2E tests are slower than unit tests:
- **Unit tests**: ~100ms per test
- **E2E tests**: ~5-10 seconds per test

To optimize:
- Run E2E tests less frequently (e.g., only on PR, not every commit)
- Use Playwright's parallel execution
- Run only affected tests during development
- Use test fixtures to avoid repeated setup

## Best Practices

1. **Keep tests independent**: Each test should work in isolation
2. **Use data-testid sparingly**: Prefer semantic selectors
3. **Avoid hard-coded waits**: Use `waitForURL`, `waitForSelector` instead of `page.waitForTimeout`
4. **Test real user flows**: Focus on end-to-end scenarios, not implementation details
5. **Clean up test data**: Use unique emails to avoid conflicts
6. **Test error states**: Don't just test happy paths
7. **Check accessibility**: Include ARIA attributes and keyboard navigation

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Guide](https://playwright.dev/docs/ci)
