# System Architecture & Data Flow Guide

Aegis GRC uses a modern, serverless, decoupled micro-architecture designed to deliver high speed, zero backend cold-starts, and cost-free execution. 

This document explains the structural components, data lifecycles, caching schemes, and fallback environments of the platform.

---

## 🗺️ Architectural Concept

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                            │
│                                                                        │
│  ┌───────────────────────┐   ┌───────────────────┐   ┌──────────────┐  │
│  │   Vite React Web UI   │   │  TanStack Query   │   │ Zustand Store│  │
│  │ (Tailwind CSS, ECharts)│  │ (Caching/Refetch) │   │ (Theme/Scale)│  │
│  └───────────┬───────────┘   └─────────▲─────────┘   └──────────────┘  │
│              │                         │                               │
│              ▼ (Intercepted Fetch)     │                               │
│     ┌──────────────────────────────────┴─────────────────────────┐     │
│     │    global window.fetch Interceptor (frontend/main.tsx)      │     │
│     └────────┬─────────────────────────────────┬─────────────────┘     │
└──────────────┼─────────────────────────────────┼───────────────────────┘
               │ (Fallback Sandboxed Mode)       │ (Production Active Mode)
               ▼                                 ▼
┌──────────────────────────────┐       ┌─────────────────────────────────┐
│     Client Mock Database     │       │     Cloudflare Edge Network     │
│       (frontend/utils)       │       │                                 │
│  ┌────────────────────────┐  │       │  ┌───────────────────────────┐  │
│  │ mockApi.ts Interceptor │  │       │  │   Hono Serverless Worker  │  │
│  └───────────┬────────────┘  │       │  │ (backend/src/index.ts)    │  │
│              │               │       │  └─────────────┬─────────────┘  │
│              ▼               │       │                │                │
│  ┌────────────────────────┐  │       │                ▼                │
│  │  Browser LocalStorage  │  │       │  ┌───────────────────────────┐  │
│  │  (grc_mock_tables)     │  │       │  │  Cloudflare D1 Database   │  │
│  └────────────────────────┘  │       │  │ (SQLite Relational Store) │  │
│                              │       │  └───────────────────────────┘  │
└──────────────────────────────┘       └─────────────────────────────────┘
```

---

## 1. Sandbox Fallback Interceptor Architecture

To allow seamless testing without setting up databases or cloud accounts, Aegis GRC implements a **browser-side database simulator**:

* **How Interception Works:** Inside [main.tsx](file:///d:/Projects/Enterprise_Risk_Assessment_Platform/frontend/src/main.tsx), the application overrides the browser's global `window.fetch` function.
* **Sandbox Trigger:** If the environment parameter `VITE_API_URL` is omitted, or if a connection to the Cloudflare Worker API fails, the interceptor redirects all HTTP requests to [mockApi.ts](file:///d:/Projects/Enterprise_Risk_Assessment_Platform/frontend/src/utils/mockApi.ts).
* **Database Simulation:** The mock API acts as a web server running inside the browser. It parses request routes, reads and writes JSON tables stored in `localStorage`, and calculates analytics metrics (such as the 5x5 Inherent Risk Heatmap and Compliance Index percentage) on the fly.
* **Why This Matters:** For non-technical users, it runs the entire software offline inside the browser with zero installation steps. For developers, it provides a safe sandbox to test UI modifications.

---

## 2. Production Runtime Architecture

In production, requests bypass the local interceptor and route directly to Cloudflare's serverless edge:

### Hono Edge Workers
* The backend is built using the Hono framework, compiled into a single Worker script, and deployed to Cloudflare's global CDN nodes.
* Hono workers execute inside V8 Isolates instead of heavy containers (like Docker or Node.js VMs). This eliminates "cold starts," resolving API latency.

### SQLite Database on Cloudflare D1
* Cloudflare D1 provides a relational database built on SQLite, running at the edge. 
* Schema migrations are compiled using Drizzle ORM and pushed directly to D1. 
* Standard relational integrity is enforced (cascade deletes, foreign keys, and indexes on email fields to optimize querying speeds).

### Stateless JWT Verification via JWKS
1. The user logs in via the **Firebase Authentication Client SDK** in their browser.
2. Firebase returns a signed JSON Web Token (JWT).
3. For subsequent API requests, the client passes this token in the `Authorization: Bearer <token>` header.
4. The Hono API middleware intercepts the request, reads the token header, and queries Google's public JSON Web Key Sets (JWKS) endpoint to verify the certificate signature.
5. If the signature is valid, the user's UID is decoded and matched against their user record in D1 to determine their role permissions.

---

## 3. Client State & Cache Layers

Aegis GRC organizes state management into distinct layers:

### Caching Engine (TanStack Query)
* Manages all network-bound database tables.
* Implements query invalidation: when a user adds a risk or updates a treatment, TanStack Query automatically invalidates the relevant cache keys (e.g. `['risks']`, `['dashboard-stats']`), triggering background API refreshes to update metrics immediately.

### Local State (Zustand)
* Manages light-weight client states that require immediate rendering:
  * **Theme Mode:** Dark/Light theme switching by toggling the `.dark` class on the `<html>` document root.
  * **Layout Scale:** Controls the base font-size mapping (`24.0px` root for Small, `27.0px` for Medium, `30.0px` for Large) to adjust readability globally.
  * **Toast Alerts:** Triggers slide-in status alerts (success, error, warning).

### Client-Side Exporters
* Compliance reports (PDF and Excel spreadsheets) are compiled entirely within the browser utilizing `jspdf` and `exceljs` on client threads. This offloads PDF processing from the backend, keeping server utilization at zero cost.
