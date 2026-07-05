# Contributing Guidelines

This GRC codebase is built on **SOLID principles**, **DRY**, **KISS**, and **Secure-by-Design** concepts.

---

## 1. Code Standards
* **TypeScript**: Enforce strict typing. Omit the use of `any` type casts wherever possible.
* **ORM Migrations**: Always edit schemas in `backend/src/db/schema.ts` and compile migrations using `npm run db:generate`. Never write migrations manually.
* **Component Design**: Build modular, reusable React components in the `frontend/src/components` directory. Avoid monolithic page implementations.
* **Documentation**: Document complex risk calculation algorithms or middleware interceptors using JSDoc formatting.

---

## 2. Git Workflow
1. Create a descriptive feature branch:
   ```bash
   git checkout -b feature/risk-matrix-customization
   ```
2. Commit with context prefixes:
   * `feat: ...` for new functions.
   * `fix: ...` for resolving bugs.
   * `docs: ...` for writing documentation.
3. Test your changes locally:
   ```bash
   npm run test
   ```
4. Push to remote and open a Pull Request.
5. In case of database model modifications, ensure production migrations are applied before code releases:
   ```bash
   npm run db:migrate:prod
   ```
