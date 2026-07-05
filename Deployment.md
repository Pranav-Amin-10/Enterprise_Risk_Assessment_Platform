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

### Step 2: Create a Cloudflare R2 Bucket
Run the wrangler command to provision the R2 storage bucket:
```bash
npx wrangler r2 bucket create enterprise-risk-assessment-evidence
```

### Step 3: Run Database Migrations on Production D1
Apply your Drizzle migrations directly to the live Cloudflare edge D1 database:
```bash
npm run db:migrate:prod
```

### Step 4: Deploy Hono API Worker
Deploy the code to Cloudflare Workers:
```bash
npm run deploy -w backend
```
Set the environment variable secrets for Firebase Project ID in Cloudflare dashboard or via:
```bash
npx wrangler secret put FIREBASE_PROJECT_ID -w backend
```

---

## 2. Cloudflare Pages Frontend Deployment

1. Log in to your Cloudflare Dashboard and navigate to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
2. Select your GitHub repository containing the codebase.
3. Configure build settings:
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build -w frontend`
   * **Build Output Directory**: `frontend/dist`
   * **Root Directory**: `/`
4. Deploy the application. Once built, Cloudflare Pages will provide you with a production URL (e.g. `https://enterprise-risk.pages.dev`).
