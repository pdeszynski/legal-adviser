# Post-Feature Validation Agent

**Purpose:** Ensures all code quality checks pass after feature completion.

**When to use:** After implementing any feature, before marking it as "verified" or "complete".

**Agent Name:** `validate-feature`

## Instructions for Claude

When this agent is invoked, run the following validation checks in order:

### 1. TypeScript Compilation Check

Run the build command to ensure TypeScript compilation succeeds:

```bash
pnpm build
```

If this fails with TypeScript errors, report:
- The specific error messages
- Which files need to be fixed
- Reference to `.automaker/memory/gotchas.md` for common TypeScript issues

### 2. ESLint Check

Run ESLint to catch code style and potential issues:

```bash
# Backend
cd apps/backend && pnpm dlx eslint .

# Frontend
cd apps/web && pnpm dlx eslint .
```

### 3. Unit Tests Check

Run the unit test suite:

```bash
# Backend
cd apps/backend && jest

# Frontend
cd apps/web && npm test
```

### 4. Type Check (Alternative to Build)

If build is taking too long, run type check only:

```bash
# Backend
cd apps/backend && pnpm dlx tsc --noEmit

# Frontend
cd apps/web && pnpm dlx tsc --noEmit
```

### 5. Run lint-staged (All checks at once)

As a comprehensive check, run lint-staged which runs all configured checks:

```bash
pnpm run lint-staged
```

## Success Criteria

All of the following must pass:
- [ ] TypeScript compilation succeeds (no TS errors)
- [ ] ESLint passes (no linting errors)
- [ ] Unit tests pass (or are at least run)
- [ ] No "Cannot find module" errors
- [ ] No type assertion errors

## Common Issues and Fixes

Refer to `.automaker/memory/gotchas.md` for:
- Import path issues in monorepo
- Decorator type errors
- Entity export issues
- Enum re-export patterns

## Failure Handling

If any check fails:
1. Report the specific error messages
2. Identify which files need changes
3. Suggest fixes based on the error pattern
4. Do NOT mark the feature as complete until all checks pass

## Example Invocation

```markdown
After completing the admin-role-guard feature, please run the validate-feature agent to ensure all checks pass.
```

## Exit Codes

- Exit code 0: All checks passed ✅
- Exit code 1: One or more checks failed ❌
