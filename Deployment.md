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

## 2. Cloudflare Pages Frontend Deployment (Web UI Setup)

To deploy the React client frontend using the Cloudflare Dashboard Web UI:

1. Log into your **[Cloudflare Dashboard](https://dash.cloudflare.com/)**.
2. Navigate to **Workers & Pages** in the left sidebar -> Click **Create application** -> Select the **Pages** tab -> Click **Connect to Git**.
3. Authenticate with GitHub and select your repository.
4. In the **Build settings** configuration page, enter the following parameters:
   * **Project name**: `enterprise-risk-assessment`
   * **Production branch**: `main` (or your active branch)
   * **Framework preset**: `Vite`
   * **Build command**: `npm run build`
   * **Build output directory**: `dist`
   * **Root directory**: `frontend` (Change this to `frontend` to isolate client dependencies and bypass workspace caching bugs)
5. *(Optional)* Click **Environment variables (advanced)** and add a variable `NODE_VERSION` set to `18` or `20` to ensure package building compatibility.
6. Click **Save and Deploy**. Cloudflare Pages will build and deploy the React application on a free `.pages.dev` subdomain (e.g. `https://enterprise-risk-assessment.pages.dev`).

> [!TIP]
> **Troubleshooting Build Error 126 (Permission Denied for `tsc`)**:
> If you previously attempted to deploy with the root directory set to `/` and then changed it to `frontend`, Cloudflare's build cache may restore corrupt `node_modules` symlinks from the previous attempt. To fix this, click the **three dots** next to the deploy button in the Cloudflare Pages dashboard and select **Retry deployment** -> **Clear cache and deploy**. This forces a fresh, clean install.

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
