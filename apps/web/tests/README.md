# E2E Tests

This directory contains End-to-End (E2E) tests for the Legal AI Platform using Playwright.

## Running E2E Tests

### Prerequisites

1. **Ensure all services are running**: The tests expect the backend and frontend to be running.

   ```bash
   # From the project root, start all services
   pnpm dev
   ```

2. **Or use specific services**:

   ```bash
   # Backend (GraphQL API at http://localhost:3001)
   cd apps/backend && pnpm dev

   # Frontend (Web app at http://localhost:3000)
   cd apps/web && pnpm dev
   ```

3. **Database should be seeded** (optional but recommended):
   ```bash
   cd apps/backend && pnpm seed
   ```

### Running Tests

```bash
# From apps/web directory
cd apps/web

# Run all E2E tests
npx playwright test

# Run a specific test file
npx playwright test ask-legal-question-verification.spec.ts

# Run tests in headed mode (see browser window)
npx playwright test --headed

# Run tests with UI mode (interactive debugging)
npx playwright test --ui

# Run tests with debug mode
npx playwright test --debug
```

### Test Configuration

- **Base URL**: Tests use `http://localhost:3001` for GraphQL by default
- **Default User**: `admin@refine.dev` / `password` (from seed data)

### Important Notes

1. **CSRF Protection**: Tests must fetch a CSRF token from `/api/csrf-token` before making mutations. See `ask-legal-question-verification.spec.ts` for the pattern.

2. **Rate Limiting**: The backend has rate limiting on login. If you see "ThrottlerException: Too Many Requests", wait a minute before retrying.

3. **AI Engine**: Some tests expect the AI engine to be running. Tests will skip if the AI engine is not available.

4. **Authentication**: Tests use the seeded admin user. Ensure the database has been seeded or update the test credentials.

## Test Files

- `ask-legal-question-verification.spec.ts` - Tests for the legal AI Q&A functionality
- `chat-ui-verification.spec.ts` - Tests for chat UI components
- `settings-*.spec.ts` - Tests for settings functionality
- `locale-switcher-verification.spec.ts` - Tests for language switching

## Debugging Failed Tests

1. **Run with trace**: `npx playwright test --trace on`
2. **View trace**: `npx playwright show-trace trace.zip`
3. **Run specific test**: `npx playwright test -g "test name"`
4. **Use headed mode**: `npx playwright test --headed`

## Adding New Tests

1. Create a new `.spec.ts` file in this directory
2. Import Playwright test utilities:
   ```typescript
   import { test, expect } from '@playwright/test';
   ```
3. Follow the existing pattern for CSRF token handling and authentication
4. Run `npx playwright test` to verify your new tests
