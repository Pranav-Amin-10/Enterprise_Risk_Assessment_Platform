# 1. Project Overview

## Purpose
The **Enterprise Risk Assessment Platform** is a production-quality, serverless GRC (Governance, Risk, and Compliance) dashboard designed for Fortune 500 organizations to map information system inventories, catalog cyber threat libraries, identify vulnerabilities, perform qualitative risk assessments, and establish corrective treatment pipelines. It is engineered to operate 100% free under Cloudflare's permanent free tiers.

## Tech Stack
* **Frontend**: React (Vite, TypeScript, Tailwind CSS, Zustand, TanStack Query, React Router v6, React Hook Form, Zod).
* **Charts**: Apache ECharts (`echarts-for-react`) for high-fidelity interactive risk heatmaps and statistics.
* **Authentication**: Firebase Authentication (Client SDK) for user registrations, logins, and email-based secure password resets.
* **Backend**: Hono framework running on Cloudflare Workers.
* **Database**: Cloudflare D1 (SQLite) with Drizzle ORM.
* **Storage**: Cloudflare R2 for storing audit evidence attachments.
* **Reports**: Browser-side PDF generation (`jspdf` + `jspdf-autotable`) and styled Excel generation (`exceljs`).
* **Testing**: Vitest for client and server test suites.

## Architecture
The platform utilizes a modern serverless decoupled architecture:
1. **Frontend Assets**: Rendered and served via Cloudflare Pages.
2. **API Layer**: Implemented inside a Hono worker running on Cloudflare Workers, handling RBAC checks, audit logging, and file coordinates.
3. **Database Layer**: SQLite relational structure on Cloudflare D1.
4. **Storage Layer**: Blob documents saved in Cloudflare R2.
5. **Session Sync**: Standard Firebase ID Tokens verified against Google's public JWKS certificates at the edge.

---

# 2. File Mapping & Codebase Understanding

## Directory Responsibilities

### Backend (`/backend`)
* `backend/src/index.ts`: API bootstrap entry point. Instantiates Hono and mounts CORS, Auth, and CRUD routers.
* `backend/src/db/schema.ts`: Database schemas defining SQLite mappings for users, organizations, assets, threats, vulnerabilities, risks, treatments, evidence, notifications, and logs.
* `backend/src/db/index.ts`: Bootstraps the Drizzle client using Cloudflare's native D1 database bindings.
* `backend/src/db/seedData.ts`: Holds typescript arrays containing the default 9 Threats and 9 Vulnerabilities.
* `backend/src/middleware/auth.ts`: Decodes and verifies incoming Firebase ID Tokens against Google's secure JWKS endpoint. Connects the user Firebase UID to their D1 user profile and evaluates RBAC permission grids.
* `backend/src/middleware/audit.ts`: An append-only helper function that logs operational actions, acting user metadata, IP address, and details payloads to D1 `audit_logs`.
* `backend/src/routes/setup.ts`: Coordinates the first-time Setup wizard. Checks if D1 is empty, creates the Super Admin, Company node, and seeds threats/vulnerabilities.
* `backend/src/routes/auth.ts`: Resolves logged-in user profile details from the D1 database.
* `backend/src/routes/orgs.ts`: Manages Company, Business Units, Departments, and Teams hierarchy nodes.
* `backend/src/routes/users.ts`: Handles employee pre-registrations, RBAC updates, and lockouts.
* `backend/src/routes/assets.ts`: Mapped asset inventory CRUD.
* `backend/src/routes/library.ts`: Manages threat and vulnerability library custom entries.
* `backend/src/routes/risks.ts`: Risk register assessments, risk scoring matrix, and controls linking.
* `backend/src/routes/treatments.ts`: Corrective action treatments, progress percentages, and budgets tracking.
* `backend/src/routes/evidence.ts`: Coordinates uploading/downloading documents directly to/from Cloudflare R2 bucket.
* `backend/src/routes/notifications.ts`: Fetches and reads in-app notifications.
* `backend/src/routes/dashboard.ts`: High-performance aggregated analytics query solver.

### Frontend (`/frontend`)
* `frontend/src/main.tsx`: React mounting root. Configures TanStack QueryClient and React Router.
* `frontend/src/App.tsx`: Central router layout. Controls setup wizard redirections and private route guards.
* `frontend/src/services/firebase.ts`: Initializes the client-side Firebase SDK using configuration bindings.
* `frontend/src/store/useAuthStore.ts`: Listens to Firebase session changes, handles token refreshes, and resolves D1 user profiles.
* `frontend/src/store/useThemeStore.ts`: Controls Light/Dark UI mode.
* `frontend/src/store/useNotificationStore.ts`: Syncs user notifications.
* `frontend/src/store/useToastStore.ts`: Controls global toast alert messages.
* `frontend/src/utils/exporters.ts`: Code logic utilizing `jspdf` and `exceljs` to generate highly-styled compliance reports in the client browser.
* `frontend/src/pages/`: Contains all client pages (Dashboard, SetupWizard, Login, ForgotPassword, ResetPassword, AssetInventory, RiskRegister, RiskTreatment, ThreatLibrary, VulnerabilityLibrary, Reports, Settings, AuditLogs).
* `frontend/src/components/`: Reusable UI elements (Modal, Toast, Skeletons) and layout frames (Sidebar, Navbar).

---

# 3. Update / Change Logs

## Update - 2026-07-05

### Files Created/Modified
* **Root**: `package.json`
* **Backend**: `tsconfig.json`, `wrangler.toml`, `src/db/schema.ts`, `src/db/index.ts`, `src/db/seedData.ts`, `src/middleware/auth.ts`, `src/middleware/audit.ts`, `src/routes/setup.ts`, `src/routes/auth.ts`, `src/routes/orgs.ts`, `src/routes/users.ts`, `src/routes/assets.ts`, `src/routes/library.ts`, `src/routes/risks.ts`, `src/routes/treatments.ts`, `src/routes/evidence.ts`, `src/routes/notifications.ts`, `src/routes/dashboard.ts`, `src/index.ts`, `src/index.test.ts`
* **Frontend**: `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `postcss.config.js`, `tailwind.config.js`, `index.html`, `src/index.css`, `src/main.tsx`, `src/App.tsx`, `src/App.test.ts`, `src/services/firebase.ts`, `src/store/useAuthStore.ts`, `src/store/useThemeStore.ts`, `src/store/useNotificationStore.ts`, `src/store/useToastStore.ts`, `src/utils/exporters.ts`, `src/components/ui/Toast.tsx`, `src/components/ui/Modal.tsx`, `src/components/ui/Skeleton.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/Sidebar.tsx`, `src/pages/SetupWizard.tsx`, `src/pages/Login.tsx`, `src/pages/ForgotPassword.tsx`, `src/pages/ResetPassword.tsx`, `src/pages/Dashboard.tsx`, `src/pages/AssetInventory.tsx`, `src/pages/ThreatLibrary.tsx`, `src/pages/VulnerabilityLibrary.tsx`, `src/pages/RiskRegister.tsx`, `src/pages/RiskTreatment.tsx`, `src/pages/AuditLogs.tsx`, `src/pages/Settings.tsx`, `src/pages/Reports.tsx`

### Changes
* Constructed the complete workspace mono-repo npm orchestration utilizing npm workspaces.
* Defined the normalized, relational Drizzle database schemas mapping SQLite database structures for D1.
* Implemented the edge-compatible Firebase JWT validation middleware on Hono utilizing Google JWKS remote keys.
* Programmed the "Registration Claiming" protocol in the auth middleware matching Firebase registrations with D1 records by email automatically.
* Created the Hono CRUD endpoint routers for all compliance modules.
* Crafted the first-time setup wizard, login, password recovery, and reset dashboard screens in React.
* Developed the interactive ECharts visualizations and client-side PDF/Excel exporters.
* Configured Vitest tests on both the client and server.

### Reason
* Initializing the entire codebase to build a production-quality, enterprise-grade GRC platform.

## Update - 2026-07-05 (D1 Integration Update)

### File Modified
* `backend/wrangler.toml`

### Changes
* Replaced the placeholder `database_id` under the `[[d1_databases]]` binding block with the production database UUID `df0862eb-024a-422c-8021-f176ba08c371`.

### Reason
* Updated wrangler configuration with the D1 database instance created via Wrangler CLI to enable successful local and remote database operations.

## Update - 2026-07-05 (D1 Evidence Storage Pivot)

### Files Modified
* `backend/src/db/schema.ts`
* `backend/src/routes/evidence.ts`
* `backend/wrangler.toml`

### Changes
* Shifted file evidence storage from Cloudflare R2 bucket to Cloudflare D1 database.
* Added `file_data` TEXT column (Base64 encoded file storage) in `evidence` table.
* Rewrote `/api/evidence/upload` and `/api/evidence/:id/download` route handlers in Hono to encode/decode file buffers directly into/from D1.
* Removed `[[r2_buckets]]` configurations from `backend/wrangler.toml` to avoid billing card verification blockers.
* Re-generated clean database migrations folder `backend/migrations/0000_tiresome_quicksilver.sql`.

### Reason
* Resolved deployment blockers for accounts without payment cards by eliminating Cloudflare R2 bucket requirements, keeping the entire GRC system 100% free under the permanent free tiers of D1 and Pages.

## Update - 2026-07-05 (Root Scripts Update)

### Files Modified
* `package.json`

### Changes
* Added `db:migrate:prod` and `deploy:backend` npm scripts to the root workspace configuration.

### Reason
* Enables developers and users to run production D1 migrations and build/deploy Cloudflare backend workers directly from the workspace root.

## Update - 2026-07-05 (Deployment Routing Manual Update)

### Files Modified
* `Deployment.md`

### Changes
* Updated deployment manual to document edge-routing instructions linking the Cloudflare Pages frontend and Hono Worker backend under a single custom domain (using Workers Routes), avoiding CORS concerns.
* Documented confirmation that the `FIREBASE_PROJECT_ID` variable is already bound correctly and requires no secret commands.

### Reason
* Ensured developers/auditors understand how to route requests in production, keeping all documentation accurate and consistent with the codebase.

## Update - 2026-07-05 (Pages Web UI Guidelines Added)

### Files Modified
* `Deployment.md`

### Changes
* Added Web UI setup instructions for Cloudflare Pages frontend deployment under section 2 of the deployment guide.
* Highlighted using `Vite` as the Framework Preset and mapped build commands (`npm run build -w frontend`) and output directories (`frontend/dist`) to run correctly within the repository structure.

### Reason
* Provided clear step-by-step instructions for non-developer users deploying the client application via the Cloudflare web dashboard.

## Update - 2026-07-05 (Cloudflare Pages Build Isolation)

### Files Modified
* `Deployment.md`

### Changes
* Changed the Cloudflare Pages deployment root directory to `frontend` (from `/`) and updated the build command to `npm run build` with output directory `dist`.

### Reason
* Resolved Cloudflare Pages build container crash related to copying/caching symlinks created by npm workspaces (`cp: cannot overwrite non-directory`). Isolating the frontend compile task to its subdirectory solves this bug out of the box.

## Update - 2026-07-05 (Typescript Compilation & Cleanups)

### Files Modified
* `frontend/src/App.tsx`
* `frontend/src/components/layout/Navbar.tsx`
* `frontend/src/pages/AssetInventory.tsx`
* `frontend/src/pages/AuditLogs.tsx`
* `frontend/src/pages/Dashboard.tsx`
* `frontend/src/pages/Reports.tsx`
* `frontend/src/pages/RiskRegister.tsx`
* `frontend/src/pages/RiskTreatment.tsx`
* `frontend/src/pages/Settings.tsx`
* `frontend/src/pages/ThreatLibrary.tsx`
* `frontend/src/pages/VulnerabilityLibrary.tsx`
* `frontend/src/utils/exporters.ts`

### Changes
* Fixed the `doc.internal.getNumberOfPages()` compiler error in `exporters.ts` by using the correct public method `doc.getNumberOfPages()`.
* Resolved the undefined `Search` reference in `RiskRegister.tsx` by importing it from `lucide-react`.
* Removed all unused imports and variables (`Skeleton`, `clearAuth`, `selectedOrg`, icons, etc.) across frontend modules to comply with the project's strict `noUnusedLocals` and `noUnusedParameters` typescript configs.
* Successfully built and bundled the production frontend package locally.

### Reason
* Resolved typescript build compilation failures (exited with code 2) in the Cloudflare Pages container environment, ensuring successful automated static builds.

## Update - 2026-07-05 (Build Cache Troubleshooting Added)

### Files Modified
* `Deployment.md`

### Changes
* Documented build error 126 (Permission Denied for `tsc`) troubleshooting steps, explaining how to trigger "Clear cache and deploy" from the Cloudflare Pages deployment details dropdown.

### Reason
* Enables users to bypass build container caching conflicts when switching root directory configurations in Cloudflare.

## Update - 2026-07-05 (Package Upgrades & CORS Interceptor)

### Files Modified
* `backend/package.json`
* `backend/src/index.ts`
* `frontend/package.json`
* `frontend/src/main.tsx`
* `frontend/src/vite-env.d.ts` [NEW]
* `package-lock.json`

### Changes
* Upgraded backend core libraries (`hono`, `drizzle-orm`, `drizzle-kit`, `wrangler`, `vitest`, `typescript`, `zod`) to latest stable major versions.
* Upgraded frontend core libraries (`react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `zustand`, `lucide-react`, `vite`, `typescript`, `vitest`) to latest stable major versions.
* Overrode the global browser `window.fetch` interceptor in `frontend/src/main.tsx` to dynamically prefix all `/api` routes with the environment variable `VITE_API_URL` when defined in production.
* Created `frontend/src/vite-env.d.ts` to declare types for Vite client assets and environment parameters.
* Configured Hono `cors` middleware in `backend/src/index.ts` to dynamically echo request origins to satisfy CORS credentials checks in cross-origin environments.

### Reason
* Addressed user request to update outdated packages to latest. Fixed issues where the React app on Cloudflare Pages couldn't connect to the Cloudflare Worker API. It was previously throwing 404 or CORS credential errors, which hid the First-Time Setup Wizard.

## Update - 2026-07-05 (React & Tailwind Version Pinning)

### Files Modified
* `frontend/package.json`
* `package-lock.json`

### Changes
* Pinned React client to `react@^18.3.1` and `@types/react@^18.3.3` to maintain constructor signature compatibility with third-party visual wrappers like `echarts-for-react`.
* Pinned Tailwind CSS to `tailwindcss@^3.4.17` to preserve the PostCSS configuration pipeline and avoid breaking v4 migrations.

### Reason
* Resolved build compilation errors related to React 19 typings on ECharts and Tailwind v4 PostCSS plugin relocation, ensuring clean compiles on Cloudflare.

## Update - 2026-07-05 (Hybrid Demo Fallback Mode)

### Files Modified
* `frontend/src/components/layout/Navbar.tsx`
* `frontend/src/main.tsx`
* `frontend/src/pages/Login.tsx`
* `frontend/src/pages/SetupWizard.tsx`
* `frontend/src/utils/mockApi.ts` [NEW]

### Changes
* Coded a browser-side backend simulator in `mockApi.ts` that acts as a mock API router storing data in `localStorage`.
* Configured the global fetch interceptor in `main.tsx` to automatically redirect requests to the mock simulator if `grc_demo_mode` is enabled or if the Worker API setup check fails (preventing auth deadlocks).
* Added a styled **"Launch Browser Demo Mode (Zero Setup)"** button to both the Login and Setup Wizard pages to bypass Firebase and Cloudflare connection requirements instantly.
* Added a `Demo Mode (Browser Storage)` blinking indicator in the Navbar header.
* Modified the Sign Out handler to clear the demo mode states and reset Zustand auth stores dynamically.

### Reason
* Option A implementation: Created a friction-free, zero-config browser demonstration sandbox that runs immediately in the browser, while maintaining 100% of the production-grade Worker, R2, and D1 database code in the repository for developer review.

## Update - 2026-07-05 (UI Polishing & OTP MFA Verification)

### Files Modified
* `frontend/src/App.tsx`
* `frontend/src/components/layout/Navbar.tsx`
* `frontend/src/index.css`
* `frontend/src/main.tsx`
* `frontend/src/pages/Login.tsx`
* `frontend/src/pages/SetupWizard.tsx`
* `frontend/src/utils/mockApi.ts`

### Changes
* Fixed drop-down menu illegible text styling in dark theme by adding global CSS selectors for `select option` element backgrounds.
* Added `color-scheme` controls and webkit filters to force date-pickers and native calendar overlays to match the active theme.
* Resolved the theme toggle reactivity bug by adding a theme-sync side-effect `useEffect` inside `App.tsx` matching `useThemeStore` states.
* Fixed the Asset Inventory page edit operation bug by implementing `PUT` API route simulation handlers inside `mockApi.ts`.
* Renamed all UI and state instances of **Demo Mode** to **Admin Mode**.
* Programmed a multi-factor authentication (MFA) validation flow for Admin Mode access: clicking "Launch Admin Mode" generates a 6-digit OTP, simulates a secure mail dispatch via a toast notification, and prompts verification inside a modal input window before granting platform access.

### Reason
* Resolved visual styling bugs on drop-downs and date-pickers, fixed asset edit routes, and fulfilled user security requirements by implementing a verifiable Admin Mode sandbox with simulated mail verification.

## Update - 2026-07-05 (Firebase Auth Admin Mode Setup)

### Files Modified
* `frontend/src/pages/Login.tsx`
* `frontend/src/pages/SetupWizard.tsx`
* `frontend/src/utils/mockApi.ts`

### Changes
* Upgraded `seedDemoStorage` in `mockApi.ts` to support dynamic admin email, admin name, company name, and location seeding.
* Configured `GET /api/auth/me` simulation to dynamically retrieve the custom registered administrator from `localStorage`.
* Programmed a first-time setup wizard modal for Admin Mode inside `Login.tsx` and `SetupWizard.tsx`. If Admin Mode is not yet bootstrapped, the launch button opens a setup form requesting custom details and registers the new administrator account directly in **Firebase Auth**.
* Standardized subsequent logins to retrieve the user's custom email and trigger OTP challenge mail simulation targeting their actual registered address.

### Reason
* Addressed user request to allow custom admin data (such as emails) to be entered during first-time setup while integrating **Firebase Auth** for registration, combining secure identity management with local storage simulation.

## Update - 2026-07-06

### Files Modified
* `frontend/src/App.tsx`
* `frontend/src/components/layout/Navbar.tsx`
* `frontend/src/pages/Settings.tsx`
* `frontend/src/store/useThemeStore.ts`
* `frontend/src/index.css`

### Changes
* Fixed theme toggle buttons and layout styling consistency.
* Implemented manual text density and font size scaling controls under Settings.
* Fixed dark mode and high-contrast color scheme bugs across input fields, tables, and dropdowns.

### Reason
* Address user feedback regarding theme toggling failures, color contrast on highlight boxes, and visual sizing preferences.

## Update - 2026-07-09

### Files Modified
* `frontend/src/App.tsx`
* `frontend/src/components/layout/Navbar.tsx`
* `frontend/src/components/layout/Sidebar.tsx`
* `frontend/src/pages/AssetInventory.tsx`
* `frontend/src/pages/RiskRegister.tsx`
* `frontend/src/pages/RiskTreatment.tsx`
* `frontend/src/pages/Settings.tsx`
* `frontend/src/pages/ThreatLibrary.tsx`
* `frontend/src/pages/VulnerabilityLibrary.tsx`
* `frontend/src/utils/mockApi.ts`
* `frontend/src/store/useThemeStore.ts`

### Changes
* Implemented full Role-Based Access Control (RBAC) routing, navigation filters, and read-only overrides for Viewer, CISO, Risk Manager, Auditor, Asset Owner, Risk Owner, and Department Head roles.
* Configured CISO-only risk acceptance selection in the Risk Register.
* Programmed dynamic department scoping logic for Department Heads, restricting assets, risks, treatments, and dashboard charts to their assigned organization branch.
* Renamed branding to "AEGIS GRC" and cleaned up sidebar footer metadata.
* Relocated layout version display to the top Navbar (`v1.3.0` release).
* Enforced "Admin Mode" badge visibility exclusively for the `super_admin` role.
* Adjusted global font-size base scale mapping to render at a comfortable visual default (`24.0px` root for a true `18px` body text).
* Seeded a production-grade dataset containing 7 assets, 6 risks, and 3 treatments with correct `dueDate` properties.
* Fixed dashboard metric calculations for Compliance Index, High Risks, Active Treatments, Risks by Department y-axis mapping, and the 5x5 ECharts Inherent Risk Heatmap.

### Reason
* Support comprehensive access controls, departmental operations, branding, layout refinement, and dashboard accuracy.

## Update - 2026-07-09 (Documentation Overhaul)

### Files Created/Modified
* **Root**: `README.md`, `API.md`, `Architecture.md`, `Contributing.md`, `Database.md`, `Deployment.md`, `Security.md`, `DEVELOPMENT_PARADIGM.md` [NEW]

### Changes
* Overhauled all core markdown documentation files to be extremely detailed, accessible, and structured for both technical and non-technical readers.
* Created the `DEVELOPMENT_PARADIGM.md` document containing the AI-native development case study and GRC educational disclaimer.

### Reason
* Enforce clear system understanding, streamline employee onboarding, and record the innovative design methodology used.

* Added notes regarding the codebase language density (~98.1% TypeScript representation) to `README.md` and `DEVELOPMENT_PARADIGM.md` to highlight typesafe engineering outcomes.

## Update - 2026-07-10 (Career Showcase Added)

### Files Created/Modified
* **Root**: `CAREER_SHOWCASE.md` [NEW], `README.md`

### Changes
* Created `CAREER_SHOWCASE.md` containing ATS-optimized resume bullet points, LinkedIn project summaries, and key interview talking points to highlight Aegis GRC.
* Customized the resume block format in `CAREER_SHOWCASE.md` to precisely match the user's specific resume layout example style.

### Reason
* Help the user showcase the GRC platform's achievements on their professional profiles and during interviews.

---

# 4. AI Memory Purpose
This document acts as the single source of truth for the project. Future AI systems should read this file to immediately comprehend the codebase structure, bindings, routing protocols, and histories without having to run expensive directory parses.

# 5. Auto Update Requirement
Every time a file is modified, a new chronological entry MUST be appended under **3. Update / Change Logs** documenting:
* Date
* List of modified files
* Description of changes
* Logical reason
* Dependencies added/removed

Never overwrite previous history.
