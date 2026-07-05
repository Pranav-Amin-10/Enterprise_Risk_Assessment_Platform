# Enterprise Risk Assessment Platform (GRC)

An enterprise-grade Governance, Risk, and Compliance (GRC) platform designed for serverless cloud environments (Cloudflare Pages + Workers + D1 Database + R2 Storage). This platform manages cyber risks, asset inventories, threat catalogs, and mitigation treatments with zero paid dependencies and zero cloud licensing fees.

---

## Key Features
* **Stateless Firebase Edge Auth**: Secure login, registration, and email-based password recoveries using Firebase Client SDK, verified at the edge against Google's public JWKS certificates.
* **Registration Claiming**: Admins can pre-register user email addresses and RBAC roles. Once the user registers via Firebase, their session binds to the pre-configured D1 database record automatically.
* **Risk Register & Calculations**: Auto-calculates Inherent and Residual risk scores (1-25) using Likelihood (1-5) and Impact (1-5) matrices. Supports 3x3, 5x5, and 10x10 grids.
* **Interactive Heatmaps**: Built-in Apache ECharts heatmaps displaying risk counts by Likelihood/Impact intersections.
* **Auditor-Ready Reporting**: Dynamic, client-side generation of styled corporate PDFs (via `jspdf` + `jspdf-autotable`) and styled Excel spreadsheets (via `exceljs` + `file-saver`) completely free of cost.
* **Evidence Attachments**: Real-time upload and download of audit evidence documents (PDFs, images) routed directly to Cloudflare R2 object storage.
* **Immutable Audit History**: Append-only compliance ledger recording every CRUD operation, role modification, or file upload event.

---

## Directory Structure
```
├── backend/                  # Hono API Worker (Cloudflare Workers)
│   ├── migrations/           # Auto-compiled SQL migrations for D1
│   ├── src/
│   │   ├── db/               # Drizzle schemas, index bootstrap, and seed lists
│   │   ├── middleware/       # JWT Token checking and append-only audit logger
│   │   ├── routes/           # REST endpoints (auth, assets, risks, evidence, dashboard)
│   │   ├── index.ts          # Entry point mounting routes
│   │   └── index.test.ts     # Vitest suite
│   ├── package.json
│   ├── wrangler.toml         # Cloudflare Worker configuration
│   └── tsconfig.json
│
├── frontend/                 # React SPA (Vite + TS + Tailwind CSS)
│   ├── src/
│   │   ├── components/       # Layouts (Sidebar, Navbar) and UI elements (Modal, Toast)
│   │   ├── hooks/            # Session hooks
│   │   ├── pages/            # View pages (Dashboard, RiskRegister, SetupWizard)
│   │   ├── services/         # Firebase app configuration
│   │   ├── store/            # Zustand state stores (auth, notification, theme, toast)
│   │   ├── utils/            # Report generation and export utils (PDF, Excel, CSV)
│   │   ├── App.tsx           # Router mappings and layout shell
│   │   └── main.tsx          # React mounting root
│   ├── tailwind.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── package.json              # Root workspaces configuration
└── Project_Update.md         # Persistent system changelog memory
```

---

## Quick Start Setup (Local Development)

### Prerequisites
* Node.js v18+ installed.
* Local npm CLI.

### Installation & Launch
1. Clone the repository and navigate to the project directory.
2. Run the unified setup command to install dependencies, generate database migrations, and build components:
   ```bash
   npm run setup
   ```
3. Run D1 database migrations locally to build SQLite tables:
   ```bash
   npm run db:migrate
   ```
4. Start both the Vite frontend and Hono worker concurrently:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to the local client URL (usually `http://localhost:5173`).
6. The app will detect that no users exist and redirect you to the **First-Time Setup Wizard**. Enter your name, corporate email, and password to initialize the Super Admin account and seed the default Threats and Vulnerabilities database libraries.
