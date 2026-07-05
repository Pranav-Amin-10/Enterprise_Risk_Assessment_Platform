# GRC Platform Testing Guide

Quality assurance is verified using **Vitest** for both Hono backend endpoints and React client utilities.

---

## 1. Test Architecture

### Backend Tests (`backend/src/index.test.ts`)
Validates core mathematical and sanitization utilities, including:
* Inherent risk matrix calculations (`Impact * Likelihood`).
* Severity categorization boundaries.
* File-path regex sanitization filters.

### Frontend Tests (`frontend/src/App.test.ts`)
Validates client-side parsing methods:
* Splitting and cleaning comma-separated tags strings.
* Mappings of numeric CIA ratings to qualitative security labels (Low, Medium, High).

---

## 2. Running Test Suites

Execute the test suites locally:
```bash
npm run test
```
The command runs tests in both workspaces sequentially:
```bash
> enterprise-risk-assessment-platform@1.0.0 test
> npm test -w backend && npm test -w frontend
```

---

## 3. Writing New Tests

When writing new tests:
* Place test files in the matching directories alongside source files using the `.test.ts` extension.
* Avoid mocking database behaviors where possible; instead, use lightweight in-memory parameters to test logic execution directly.
