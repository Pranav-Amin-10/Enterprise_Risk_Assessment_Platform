# Aegis GRC: Career Showcase (Resume & LinkedIn Guide)

This document provides copy-pasteable text blocks designed to showcase your work on Aegis GRC on your resume (optimized for Applicant Tracking Systems - ATS) and your LinkedIn profile.

---

## 📄 1. ATS-Optimized Resume Section

### Project / Experience Entry
**Aegis GRC — Lead Software Engineer & Architect**
*Tech Stack: React 18, TypeScript (98% codebase density), Hono API Framework, Cloudflare Workers, Cloudflare D1 (SQLite), Zustand, TanStack Query, ECharts, Firebase Auth*

* Architected and deployed **Aegis GRC**, a serverless Governance, Risk, and Compliance (GRC) platform running entirely on Cloudflare Workers and D1 SQLite, achieving **₹0 database hosting and software licensing costs**.
* Implemented a comprehensive **Role-Based Access Control (RBAC) authorization grid** and dynamic database scoping, securing data isolation and UI visibility for 7 distinct enterprise roles (including CISO, Auditor, and Department Head).
* Developed an **offline fallback database simulator interceptor** (`mockApi.ts`) that redirects network requests to browser storage (`localStorage`), enabling zero-configuration offline execution.
* Engineered a **5x5 interactive risk heatmap visualization** utilizing Apache ECharts, aggregating risk density distributions dynamically based on Likelihood and Impact matrices.
* Built **browser-side document exporters** using `jspdf` and `exceljs` to generate styled compliance reports on client threads, reducing server bandwidth usage to zero.
* Programmed edge-native **stateless JWT validation** in Hono utilizing Google’s public JSON Web Key Sets (JWKS) certificates, securing API endpoints from token-tampering exploits.
* Integrated an **immutable append-only audit trail database ledger** capturing system-wide modifications (CORS validation, user pre-registrations, and uploads) to satisfy audit requirements.

---

## 💼 2. LinkedIn Profile Description

### Project Section
**Aegis GRC — Serverless Risk & Compliance Engineering Platform**

Aegis GRC is a lightweight, edge-native Governance, Risk, and Compliance (GRC) platform built to manage information asset inventories, catalog cyber threat libraries, track vulnerabilities, and map corrective remediation plans.

To bypass the high database fees and complex configuration requirements of traditional GRC suites, the platform is engineered to run entirely on serverless edge runtimes (Cloudflare Pages + Workers + D1 SQLite database), operating **completely free of cost** under Cloudflare's free tiers.

**Key Technical Achievements:**
* **98.1% TypeScript Typesafety:** Unified typesafe contracts spanning React frontend components, Drizzle ORM schemas, and Hono worker API routes.
* **Segregation of Duties (RBAC):** Seven customized role profiles (Viewer, Auditor, CISO, Risk Manager, Asset Owner, Risk Owner, and Department Head) with strict UI visibility constraints and API write protections.
* **Visual Compliance Analytics:** Interactive 5x5 Inherent Risk Heatmaps built on Apache ECharts and dynamic Compliance Index meters.
* **Zero-Setup Local Sandbox:** An offline client-side database simulator that runs the entire app inside `localStorage` for offline testing.
* **Edge-Native Security:** Stateless Firebase JWT validation at the network edge utilizing JWKS certificates.
* **Immutable Logs:** Append-only ledger tracking all platform alterations to support compliance audits.

*#GRC #Serverless #CloudflareWorkers #ReactJS #TypeScript #Cybersecurity #WebDevelopment #SoftwareArchitecture*

---

## 🗣️ 3. Key Interview Talking Points

When describing Aegis GRC in technical interviews, focus on these talking points:

### The "Why" (The Business Case)
* *"Traditional GRC tools like ServiceNow or RSA Archer cost organizations hundreds of thousands of dollars in licensing and require months of setup. I wanted to see if we could build a lightweight, fast GRC console that runs at zero server cost. I achieved this by leveraging Cloudflare's serverless edge infrastructure (Workers + Pages + D1 Database), keeping operation costs at zero under their free tier limits."*

### The "How" (The Engineering Paradigm)
* *"I developed this using an AI-Native 'Vibe Coding' model, pairing my architectural oversight and design feedback with autonomous AI coding agents. This allowed me to build, test, and document the entireTypescript codebase (monorepo frontend and edge worker backend) in a fraction of normal development times."*

### The Security Model
* *"I implemented a stateless token verification flow. The frontend handles authentication using Firebase Client SDK, and the backend Worker intercepts API requests and verifies the Firebase JWT token at the edge using Google's public JWKS certificates, which prevents token manipulation."*

### The Sandbox Interceptor
* *"To make testing easy, I wrote a browser-side fetch interceptor. If the client doesn't detect a backend URL, it intercepts requests and redirects them to a mock database simulator I coded (`mockApi.ts`) that runs the entire GRC suite inside `localStorage`, allowing users to test all roles and charts offline."*
