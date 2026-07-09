# Contributing & Development Guidelines

This document provides guidelines for developers extending the Aegis GRC platform. Adhering to these standards ensures the codebase remains robust, maintainable, and secure.

---

## 🎨 Architectural Principles
All code modifications should respect these core engineering principles:
* **SOLID Component Design:** Keep React components single-focused and modular. Avoid monolithic page implementations.
* **Don't Repeat Yourself (DRY):** Share data helpers, export formatting utilities, and UI layout parts instead of copy-pasting code.
* **Keep It Simple, Stupid (KISS):** Prefer clean, readable TypeScript patterns over over-engineered structures.
* **Secure-by-Design:** Always assume input parameters are untrusted. Sanitize inputs and enforce Role-Based Access Control (RBAC) validations at both the client routing and API layers.

---

## 📂 Core Folder Responsibilities

### Backend (`/backend`)
* `backend/src/db/schema.ts`: Single source of truth for the database structure.
* `backend/src/middleware/auth.ts`: Validates Firebase JWT tokens and parses user credentials.
* `backend/src/middleware/audit.ts`: Handles append-only logger events.
* `backend/src/routes/`: Router files (e.g. `risks.ts`, `assets.ts`, `dashboard.ts`). Mount routes in `index.ts`.

### Frontend (`/frontend`)
* `frontend/src/components/`: Reusable components (e.g., Modals, Toast notifications, layouts).
* `frontend/src/store/`: Zustand state management modules (e.g., auth, notification, theme, toast).
* `frontend/src/utils/`: Exporters, calculators, and the `mockApi.ts` database interceptor.
* `frontend/src/pages/`: Page containers. Implement write permission flags (`isReadOnly` / `user.role` check) inside these files to disable editing interfaces for unauthorized roles.

---

## 💾 Relational Schema & Migration Workflow

Aegis GRC manages database changes via Drizzle ORM. Follow these steps when modifying database structures:

```
 ┌────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
 │ Edit Schema            ├─────►│ Compile Migration       ├─────►│ Apply Migrations        │
 │ backend/db/schema.ts   │      │ drizzle-kit generate    │      │ wrangler d1 migrations  │
 └────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

1. **Modify Database Structure:** Edit columns or constraints inside [schema.ts](file:///d:/Projects/Enterprise_Risk_Assessment_Platform/backend/src/db/schema.ts).
2. **Compile Migration SQL File:** Run the compiler from the root directory to generate the D1-compatible SQL file:
   ```bash
   npm run db:generate
   ```
   This generates a new SQL file under `backend/migrations/`. Do not edit this SQL file manually.
3. **Apply Migration Locally:** Apply changes to your local testing environment:
   ```bash
   npm run db:migrate
   ```
4. **Apply Migration to Production:** When pushing to production, apply migrations to the live Cloudflare D1 database instance:
   ```bash
   npm run db:migrate:prod
   ```

---

## 💅 Styling & Theme Guidelines

We utilize **Vanilla CSS** in [index.css](file:///d:/Projects/Enterprise_Risk_Assessment_Platform/frontend/src/index.css) combined with **Tailwind CSS** utility classes.

* **Color Palette:** Avoid hardcoded hex colors. Use CSS variables to ensure components automatically adjust their colors when toggling themes:
  * Dark mode uses a dark blue-slate slate theme (`#0f172a`, `#161d30`).
  * Light mode uses clean slate-light backgrounds (`#f1f5f9`, `#ffffff`).
* **High Contrast Text:** Highlight boxes must adjust their text and border colors dynamically to maintain readability under both dark and light modes.
* **Layout Scaling:** Layout components must use `rem` units for padding, margins, and heights to ensure the entire UI scales proportionally when users adjust the interface density (Small, Medium, Large) in Settings.

---

## 🧪 Testing Guidelines

Verify changes before committing by running unit and integration tests:
* **Vitest** is used for test execution.
* Ensure tests run successfully:
  ```bash
  # Run all test suites
  npm test
  ```
* Write tests in corresponding `.test.ts` files adjacent to the source code file.

---

## 🚀 Git Branching & Pull Request Checklist

1. Create a branch from `main` using descriptive prefixes:
   * `feat/your-feature-name` (new features)
   * `fix/bug-fix-description` (bug fixes)
   * `docs/documentation-update` (docs updates)
2. Commit messages must be clear and concise (e.g. `feat: implement auditor role scoping on reports`).
3. Before submitting a Pull Request, verify:
   - [ ] The codebase builds cleanly with no compiler warnings: `npm run build -w frontend`.
   - [ ] All Vitest tests pass: `npm test`.
   - [ ] The database migrations (if any) are compiled and committed.
   - [ ] Any updates to routing, database models, or visual sizes are documented in `Project_Update.md`.
