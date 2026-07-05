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
