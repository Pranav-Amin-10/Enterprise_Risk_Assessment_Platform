# Cloudflare Production Deployment Guide

This guide outlines deployment steps to deploy the application on Cloudflare (Pages + Workers) completely free of cost.

---

## 1. Cloudflare Workers API Deployment

### Step 1: Create a Cloudflare D1 Database
Execute the following wrangler command to create the production D1 database instance:
```bash
npx wrangler d1 create enterprise-risk-assessment-db
```
Wrangler will output the D1 configuration bindings:
```toml
[[d1_databases]]
binding = "DB"
database_name = "enterprise-risk-assessment-db"
database_id = "YOUR_PRODUCTION_DATABASE_UUID"
```
Replace the placeholder `database_id` in your local `backend/wrangler.toml` file with this production UUID.



### Step 3: Run Database Migrations on Production D1
Apply your Drizzle migrations directly to the live Cloudflare edge D1 database:
```bash
npm run db:migrate:prod
```

### Step 4: Deploy Hono API Worker
Deploy the code to Cloudflare Workers:
```bash
npm run deploy:backend
```

> [!NOTE]
> The Firebase Project ID has been successfully bound as a public environment variable via `wrangler.toml` (as seen in the deploy logs: `- Vars: - FIREBASE_PROJECT_ID: "enterprise-risk-assessme-96510"`). You do not need to run `wrangler secret put` command.

---

## 3. Production Routing & Domain Configuration

In production, to ensure the Cloudflare Pages frontend can communicate with the Cloudflare Worker API under the same domain without CORS blockers:

1. **Add Custom Domain to Cloudflare Pages**:
   * Navigate to **Pages** -> Your project -> **Custom domains** -> Add your domain (e.g. `grc.company.com`).

2. **Map Workers Route to the Same Domain**:
   * Navigate to your Worker (`enterprise-risk-assessment-api`) -> **Settings** -> **Triggers** -> **Routes** -> **Add Route**.
   * Set the route path to: `grc.company.com/api/*`
   * Select your Zone.
3. This maps all `/api/*` endpoints to the Worker, while all other assets are served by Pages on the same corporate domain, matching commercial multi-tenant setups.
