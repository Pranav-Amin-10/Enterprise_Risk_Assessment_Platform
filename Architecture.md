# System Architecture Documentation

The **Enterprise Risk Assessment Platform** is built on a serverless micro-architecture, leveraging Cloudflare's edge runtime environment to provide high performance, infinite scalability, and ₹0 licensing overhead.

---

## 1. Request Lifecycle Diagram

When a user interacts with the dashboard, requests flow through the following layers:

```
[ Client Browser ]
        │  (1. Auth request)
        ▼
[ Firebase Authentication Service ]
        │  (2. Returns JWT Token)
        ▼
[ Client Browser ]
        │  (3. HTTP request with Bearer Token to /api/risks)
        ▼
[ Cloudflare Workers Edge Node ]
   ├─► [ Hono API Engine ]
   │      ├─► [ CORS Middleware ] (Blocks unauthorized cross-origin requests)
   │      ├─► [ Auth Middleware ] (Verifies Firebase token against Google JWKS)
   │      ├─► [ User Claim Resolver ] (Fetches user role from D1 database)
   │      └─► [ Audit Log Middleware ] (Appends immutable records to D1)
   │
   ├─► [ SQLite Database Layer (D1) ] (Transactional updates, Joins, Base64 Document Storage)
   └─► [ Google JWKS Keys ] (Authentication validation signatures)
```

---

## 2. Structural Layers

### Client Layer (React Single Page Application)
* **Build tool**: Vite + TypeScript compiled.
* **Layouts**: Framed utilizing Tailwind CSS, configured with native Dark Mode.
* **Caching Engine**: TanStack Query manages API data fetching, cache stale-out times, offline query retries, and optimistic mutations.
* **State Management**: Zustand handles light-weight reactive local states, notifications count badge, and visual toast notifications.

### API Middleware Layer (Hono Workers)
* Hono provides a ultra-lightweight, edge-native router running inside Cloudflare V8 isolates (no Node.js cold-starts).
* **JWT Authenticator**: Decodes JWT headers, selects the matching public certificate using the `kid` claim, validates signature, issuer (`https://securetoken.google.com/<projectId>`), and audience (`<projectId>`).
* **Registration Claiming Middleware**: Evaluates if the authenticated Firebase user profile matches a pre-provisioned D1 record by email. If matched, it overwrites the placeholder ID with the Firebase UID.

### Data Storage Layer (Cloudflare D1)
* **Cloudflare D1**: SQL database running on SQLite. Migrated via Drizzle ORM. Standard relational constructs are enforced (foreign key constraints, cascade deletes, indexing email fields).
* **Document Base64 Store**: Stored directly inside the D1 `evidence` table as Base64 strings, ensuring ₹0 operational cost and zero external storage configurations.
