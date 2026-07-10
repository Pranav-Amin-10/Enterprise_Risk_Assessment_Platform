# Aegis GRC: Career Showcase (Resume & LinkedIn Guide)

This document provides copy-pasteable text blocks designed to showcase your work on Aegis GRC on your resume (optimized for Applicant Tracking Systems - ATS) and your LinkedIn profile.

---

## 📄 1. ATS-Optimized Resume Section

### Resume Project Entry Block (Copy & Paste)
**Aegis GRC Platform | Academic/Self-Directed Project**		*May 2026 - July 2026*
* Designed and developed a serverless, web-based platform to simulate enterprise GRC (Governance, Risk, and Compliance) workflows, qualitative risk scoring matrices, and department scoping for educational purposes.
* Implemented structured role-based access controls (RBAC) and dynamic data isolation scopes for 7 distinct security roles, featuring interactive 5x5 ECharts risk heatmaps and an append-only compliance audit ledger.
* Applied typesafe TypeScript and client-side scripts to automate styled PDF/Excel compliance report generation and localStorage database simulation workflows.
* **Stack**: React, TypeScript, Hono API Worker, Cloudflare D1 (SQLite), GRC Methodology, Security Reporting
* **Project Demo Link**: `https://enterprise-risk-assessment-platform.pages.dev/`

---

## 💼 2. LinkedIn Profile Description

### Project Section
**Aegis GRC — Serverless Risk & Compliance Engineering Platform**

#### 📝 Short Project Description (For LinkedIn Summary Box)
> A serverless, edge-native GRC (Governance, Risk, and Compliance) platform built on Cloudflare Workers and D1 SQLite to map enterprise assets, threat libraries, and vulnerabilities, featuring a browser-side fallback database simulator for zero-setup offline testing.

#### ⚙️ Associated Skills (To Tag on LinkedIn)
* React.js, TypeScript, Cloudflare Workers, Hono, SQLite, Drizzle ORM, RESTful APIs, JSON Web Tokens (JWT), Apache ECharts, Governance, Risk, and Compliance (GRC), Software Architecture, Cybersecurity.

#### 📄 Full Project Description
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

* **Project Demo Link:** https://enterprise-risk-assessment-platform.pages.dev/

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
