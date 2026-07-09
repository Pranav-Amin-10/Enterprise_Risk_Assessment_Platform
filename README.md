# Aegis GRC — Enterprise Risk & Compliance Management Platform

Aegis GRC is a professional-grade, serverless Governance, Risk, and Compliance (GRC) platform designed to map information asset inventories, catalog cyber threat libraries, identify vulnerabilities, perform qualitative risk assessments, and manage corrective treatment pipelines. 

Engineered to operate 100% free under Cloudflare's permanent free tiers, Aegis GRC provides Fortune 500 scalability, enterprise security, and auditable compliance with zero paid dependencies and zero recurring software licensing fees.

---

## 📖 Plain English Overview (For Non-Technical Users)

### What is GRC and Why Does It Matter?
In any organization, managing security is not just about installing firewalls—it is about managing **risk**. Organizations must answer questions like:
1. *What important assets do we own?* (e.g., customer databases, HR servers).
2. *What threats do they face?* (e.g., Ransomware, Phishing).
3. *What weaknesses exist?* (e.g., weak password rules, outdated operating systems).
4. *How severe is the potential damage?* (Risk scoring).
5. *How are we going to fix it?* (Remediation or Treatment plans).

Aegis GRC provides a central workspace to document, track, and report on these five questions. It ensures that security decisions are documented, roles are strictly separated, and auditors can verify that the company is actively protecting its assets.

### Role Profiles: Who Sees What?
To ensure proper check-and-balance protocols (called "Segregation of Duties"), the platform restricts screens and buttons based on a user's role:
* **Viewer:** Read-only access. Ideal for executives who want to check the overall security posture and charts without editing anything.
* **Super Admin / CISO:** Unrestricted platform administrators. They configure users, build departments, audit system logs, and approve official **Risk Acceptances**.
* **Risk Manager:** The operational user. They perform risk assessments, link assets to vulnerabilities, and create remediation plans.
* **Auditor:** Independent reviewers. They have read-only access to the risk register but full visibility into the immutable **Audit History Ledger** to track system alterations.
* **Asset Owner:** Staff members in charge of IT infrastructure. They manage their asset details and record vulnerabilities.
* **Risk Owner:** Teams assigned to fix risk items. They track budgets and update progress percentages on their assigned remediation plans.
* **Department Head:** Line-of-business leaders (e.g., VP of Finance). They only see assets, risks, and dashboard charts belonging to their specific department.

---

## 🛠️ Technical Architecture (For Developers & SysAdmins)

Aegis GRC is built on a serverless decoupled stack designed to achieve ultra-fast edge execution, zero cold-starts, and absolute data isolation:

```
                  ┌─────────────────────────────────────────┐
                  │          Web Browser Client             │
                  │   (React SPA, Zustand, TanStack Query)  │
                  └────────────────────┬────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼ (API requests with Bearer Token)    ▼ (Fallback interceptor)
        ┌───────────────────────┐             ┌─────────────────────────┐
        │ Cloudflare Worker API │             │  Local Sandbox Database │
        │    (Hono Router)      │             │ (IndexedDB/LocalStorage)│
        └───────────┬───────────┘             └─────────────────────────┘
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
  ┌───────┐     ┌───────┐     ┌───────┐
  │ D1 DB │     │ JWKS  │     │ Audit │
  │SQLite │     │ Keys  │     │ Logs  │
  └───────┘     └───────┘     └───────┘
```

### The Tech Stack
1. **Frontend:** React 18 SPA compiled via Vite, written in TypeScript, and styled with high-contrast Tailwind CSS.
2. **State Management:** Zustand manages immediate UI state (such as themes, layout scale, and toast notification alerts).
3. **Caching & Queries:** TanStack Query handles caching, automated background refetches, and optimistic mutation states.
4. **Backend Worker:** Hono Router deployed on Cloudflare Workers running inside V8 isolates.
5. **Database:** SQLite relational engine hosted on Cloudflare D1.
6. **Authentication:** Firebase Client SDK handles sign-ups and passwords, which are verified at the network edge against Google's public JWKS certificates.

---

## 🚀 Key Features

* **Visual Heatmaps & Metrics:** Built-in interactive 5x5 ECharts heatmaps displaying risk distributions by Likelihood vs. Impact intersections.
* **Auditor-Ready Reporting:** Dynamic, browser-side generation of styled corporate PDFs (via `jspdf`) and Excel spreadsheets (via `exceljs`) with no backend processing required.
* **Simulated Local Sandbox:** Built-in client-side database simulator fallback (`mockApi.ts`) that runs the entire app inside `localStorage` if connection to Cloudflare or Firebase is disabled, allowing instant offline testing.
* **Security & Input Sanitization:** Parameterized SQL queries via Drizzle ORM, strict payload schemas validated by Zod, and Webkit filters enforcing dark/light color schemes.

---

## 📂 Project Directory Structure

```
├── backend/                  # API Server (Hono + Cloudflare Worker)
│   ├── migrations/           # SQLite schema migrations compiled by Drizzle
│   ├── src/
│   │   ├── db/               # Relational schemas, index configs, and seeds
│   │   ├── middleware/       # Token checkers and append-only audit log generator
│   │   ├── routes/           # Module routes (auth, assets, risks, treatments, dashboard)
│   │   └── index.ts          # API entry point
│   ├── package.json
│   └── wrangler.toml         # Cloudflare Worker deployments
│
├── frontend/                 # Client Interface (React SPA)
│   ├── src/
│   │   ├── components/       # Layout parts (Sidebar, Navbar) and UI elements
│   │   ├── store/            # State stores (auth, theme, toasts)
│   │   ├── utils/            # Mock database simulator, exports generators
│   │   ├── pages/            # Page controllers (Dashboard, RiskRegister, Settings)
│   │   ├── App.tsx           # Router mappings, layout wrapper, and RBAC guards
│   │   └── main.tsx          # React render root and dynamic API prefix hook
│   └── package.json
│
├── package.json              # Monorepo workspaces coordinator
├── Project_Update.md         # Immutable changelog log file
└── README.md                 # System overview and entry point documentation
```

---

## 💻 Local Quickstart Setup

Follow these steps to run the application locally on your computer using the built-in Sandbox simulator (requires no external databases or cloud accounts):

### Prerequisites
* **Node.js** (v18.0.0 or higher) installed on your computer.
* **npm** (usually bundled with Node.js).

### Step-by-Step Installation
1. Open your terminal or command prompt.
2. Clone the repository and navigate into the root directory:
   ```bash
   git clone https://github.com/Pranav-Amin-10/Enterprise_Risk_Assessment_Platform.git
   cd Enterprise_Risk_Assessment_Platform
   ```
3. Run the setup script to install dependencies, clean symlinks, and compile frontend assets:
   ```bash
   npm run setup
   ```
4. Seed the database tables locally:
   ```bash
   npm run db:migrate
   ```
5. Spin up both the Vite client server and the Hono worker concurrently:
   ```bash
   npm run dev
   ```
6. Open your browser and navigate to the local URL: **`http://localhost:5173`**
7. **First-Time Activation:** The interface will detect that it is a new deployment. Enter the default activation code **`123456`** and configure your Administrator email (e.g. `admin@company.com`) to activate the database.

---

## 🧪 Running Automated Tests

To ensure the GRC platform is stable, you can trigger unit and integration tests for both the frontend and backend workspaces:
```bash
# Run all tests
npm test

# Run frontend tests only
npm test -w frontend

# Run backend tests only
npm test -w backend
```

---

## 📄 License
This project is licensed under the MIT License - see the `LICENSE` file for details.
