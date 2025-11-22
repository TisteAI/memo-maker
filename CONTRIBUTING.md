# Contributing to Memo Maker

Thank you for your interest in contributing to Memo Maker! This document provides guidelines and best practices for contributing to the project.

## Development Philosophy

This project strictly follows **Test-Driven Development (TDD)** methodology. This means:

1. **Tests FIRST, code SECOND** - Always write tests before implementation
2. **Red-Green-Refactor cycle** - Write failing test → Make it pass → Refactor
3. **No test bypassing** - All features must have tests (exceptions require Technical Lead approval)

## Getting Started

### Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose
- OpenAI API key

### Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/memo-maker.git`
3. Install dependencies: `npm install`
4. Start local services: `npm run docker:up`
5. Run migrations: `npm run db:migrate -w backend`
6. Start dev server: `npm run dev:backend`

### Verify Setup

```bash
npm run test:backend    # All tests should pass
npm run lint            # No linting errors
npm run type-check      # No type errors
```

## TDD Workflow

### The Red-Green-Refactor Cycle

1. **RED** - Write a failing test
   ```bash
   # Create test file FIRST
   touch backend/src/services/__tests__/my-feature.test.ts
   # Write test that describes desired behavior
   # Run test to verify it fails
   npm run test:watch -w backend
   ```

2. **GREEN** - Write minimal code to make test pass
   ```bash
   # Create implementation file
   touch backend/src/services/my-feature.service.ts
   # Write simplest code to pass the test
   # Verify test passes
   ```

3. **REFACTOR** - Improve code while keeping tests green
   ```bash
   # Clean up, optimize, remove duplication
   # Ensure tests still pass
   ```

### Example: Adding New Feature

**Step 1: Write the test FIRST**

```typescript
// backend/src/services/__tests__/memo.service.test.ts
describe('MemoService (unit)', () => {
  describe('createMemo', () => {
    it('should create memo with valid data', async () => {
      const service = new MemoService(prisma);
      const user = await helpers.createUser();

      const memo = await service.createMemo(user.id, {
        title: 'Team Meeting',
        date: new Date(),
      });

      expect(memo.id).toBeDefined();
      expect(memo.title).toBe('Team Meeting');
      expect(memo.userId).toBe(user.id);
      expect(memo.status).toBe('UPLOADING');
    });

    it('should throw ValidationError for missing title', async () => {
      const service = new MemoService(prisma);
      const user = await helpers.createUser();

      await expect(
        service.createMemo(user.id, { title: '', date: new Date() })
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

**Step 2: Run test (should FAIL)**

```bash
npm run test:watch -w backend
# ❌ MemoService is not defined
```

**Step 3: Implement minimal code to pass**

```typescript
// backend/src/services/memo.service.ts
import { ValidationError } from '../utils/errors.js';

export class MemoService {
  constructor(private prisma: PrismaClient) {}

  async createMemo(userId: string, data: { title: string; date: Date }) {
    if (!data.title?.trim()) {
      throw new ValidationError('Title is required');
    }

    return this.prisma.memo.create({
      data: {
        userId,
        title: data.title,
        date: data.date,
        status: 'UPLOADING',
      },
    });
  }
}
```

**Step 4: Verify tests pass**

```bash
# ✅ All tests passing
```

**Step 5: Refactor (if needed)**

## Code Coverage Requirements

### Minimum Coverage Thresholds

- **Backend overall**: 80%
- **Frontend overall**: 70%
- **Security-critical code**: 100% (authentication, authorization, payments)

### Checking Coverage

```bash
npm run test:coverage -w backend
```

### Coverage Reports

Coverage reports are generated in `backend/coverage/` directory. Open `coverage/index.html` in a browser to view detailed coverage.

## Code Style

### TypeScript

- Use strict TypeScript (`strict: true` in tsconfig.json)
- Prefer interfaces over types for object shapes
- Use explicit return types for public functions
- Avoid `any` - use `unknown` if type is truly unknown

### Naming Conventions

- **Files**: kebab-case (`auth.service.ts`, `memo.routes.ts`)
- **Classes**: PascalCase (`AuthService`, `MemoService`)
- **Functions/Variables**: camelCase (`createMemo`, `userId`)
- **Constants**: UPPER_SNAKE_CASE (`JWT_SECRET`, `BCRYPT_ROUNDS`)

### Error Handling

Always use custom error classes from `utils/errors.ts`:

```typescript
import { ValidationError, NotFoundError } from '../utils/errors.js';

if (!user) {
  throw new NotFoundError('User');
}

if (!isValid) {
  throw new ValidationError('Invalid input', details);
}
```

### Async/Await

- Always use `async/await` over raw promises
- Handle errors with try/catch or let them bubble up
- Use `Promise.all()` for parallel operations

```typescript
// ✅ Good
const [user, subscription] = await Promise.all([
  prisma.user.findUnique({ where: { id } }),
  prisma.subscription.findUnique({ where: { userId: id } }),
]);

// ❌ Bad - sequential when could be parallel
const user = await prisma.user.findUnique({ where: { id } });
const subscription = await prisma.subscription.findUnique({ where: { userId: id } });
```

## Testing Best Practices

### Test Structure

```typescript
describe('FeatureName', () => {
  describe('methodName', () => {
    it('should do something with valid input', async () => {
      // Arrange - set up test data
      const user = await helpers.createUser();

      // Act - perform action
      const result = await service.doSomething(user.id);

      // Assert - verify outcome
      expect(result).toBeDefined();
    });

    it('should throw error with invalid input', async () => {
      // Test error cases
      await expect(service.doSomething(null)).rejects.toThrow();
    });
  });
});
```

### Test Isolation

- Each test should be independent
- Use `beforeEach` to clean database between tests
- Don't rely on execution order
- Use test helpers for common setup

```typescript
beforeEach(async () => {
  await helpers.cleanDatabase();
});
```

### Test Naming

Use descriptive test names that explain behavior:

```typescript
// ✅ Good
it('should return 401 for missing authorization header', async () => {});
it('should create subscription with FREE tier for new users', async () => {});

// ❌ Bad
it('test auth', async () => {});
it('works', async () => {});
```

## Pull Request Process

### Before Submitting PR

1. **Write tests first** - TDD is mandatory
2. **Run all checks**:
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run test:coverage
   ```
3. **All tests must pass**
4. **Coverage thresholds must be met**
5. **No linting errors**
6. **No TypeScript errors**

### PR Title Format

Use conventional commits:

```
feat: Add memo creation endpoint
fix: Resolve token refresh race condition
test: Add tests for auth service
docs: Update API documentation
refactor: Simplify error handling
```

### PR Description

Include:

1. **What** - What changes were made
2. **Why** - Why these changes were necessary
3. **How** - How you implemented the changes (especially if complex)
4. **Testing** - What tests were added/modified
5. **Coverage** - Coverage report showing thresholds met

### Example PR Description

```markdown
## What
Implements memo creation endpoint with audio upload to S3.

## Why
Users need to create memos and upload audio recordings.

## How
- Created MemoService with createMemo method (TDD)
- Added POST /api/memos endpoint
- Integrated AWS S3 for audio storage
- Added BullMQ job for transcription processing

## Testing
- ✅ 15 new unit tests for MemoService
- ✅ 8 integration tests for memo routes
- ✅ Coverage: 94% (exceeds 80% requirement)

## Screenshots
[If applicable]
```

### Code Review Checklist

Reviewers will check:

- [ ] Tests written BEFORE implementation (TDD)
- [ ] All tests passing
- [ ] Coverage thresholds met
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] Code follows style guide
- [ ] Appropriate error handling
- [ ] Security considerations addressed
- [ ] Documentation updated

## Security Guidelines

### Authentication

- Never store passwords in plain text
- Always use bcrypt for password hashing (10+ rounds)
- Implement token rotation for refresh tokens
- Use short-lived access tokens (15 minutes)

### Input Validation

- Validate ALL user input using Zod schemas
- Sanitize data before database operations
- Use parameterized queries (Prisma handles this)

### Sensitive Data

- Never commit secrets to git
- Use environment variables for config
- Use AWS Secrets Manager in production
- Don't log sensitive data (passwords, tokens)

### Dependencies

- Keep dependencies up to date
- Run `npm audit` regularly
- Review security advisories

## Need Help?

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Security**: Email security@example.com (do not open public issue)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
