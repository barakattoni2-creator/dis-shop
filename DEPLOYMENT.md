# Deployment Guide (Vercel)

Step-by-step instructions to take DIS Shop from a local checkout to a live production deployment on
Vercel. See `ENVIRONMENT.md` for the full environment variable reference referenced throughout this guide.

## 0. Prerequisites

- Node.js **20.9 or newer** (pinned in `package.json` under `engines`; matches Next.js 16's own requirement).
- A [Vercel](https://vercel.com) account.
- A Postgres database — [Neon](https://neon.tech) or [Supabase](https://supabase.com) both have a free tier
  that's sufficient to start. **Use the pooled connection string** (Neon: the host containing `-pooler`),
  not the direct connection — Vercel serverless functions open a new DB connection per invocation, and a
  direct connection's connection-limit will be exhausted under real traffic.
- (Optional) A [Cloudinary](https://cloudinary.com) account, for product image uploads from the admin
  dashboard.
- (Optional) An Odoo 18 instance with XML-RPC access, if you're syncing to a live Odoo backend rather than
  running in local/mock mode.
- (Optional) An OpenAI API key, if you want the AI suggestion/assistant features active rather than inert.

This project has no git repository initialized yet locally. Initialize one and push it to GitHub (or
GitLab/Bitbucket) first — Vercel deploys from a connected git repository:

```bash
git init
git add .
git commit -m "Initial commit"
# create an empty repo on GitHub first, then:
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

## 1. Provision the database

1. Create a Postgres database (Neon or Supabase) and copy its **pooled** connection string.
2. Locally, create `.env.local` from `.env.example` and set `DATABASE_URL` to that connection string.
3. Push the Prisma schema to the database:

   ```bash
   npx prisma db push
   ```

   This project manages its schema via `prisma db push` rather than the migrations workflow — there is no
   `prisma/migrations` directory. Re-run this command any time `prisma/schema.prisma` changes and needs to
   reach the production database.

4. Generate a bcrypt hash for your chosen admin password, and a random session secret:

   ```bash
   npm run hash-password -- "your-chosen-password"
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Save the hash as `ADMIN_PASSWORD_HASH` and the random string as `SESSION_SECRET` — you'll enter both
   into Vercel in step 3. This break-glass admin account (`ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH`) is your
   only way into `/admin` before any row exists in the `AdminUser` table, so treat the password like a
   root credential and rotate/remove it once you've created real admin accounts from `/admin/users`.

## 2. Import the project into Vercel

1. From the [Vercel dashboard](https://vercel.com/new), import the git repository you pushed in step 0.
2. Vercel auto-detects Next.js — leave the default build command (`next build`), install command
   (`npm install`), and output settings as-is. No `vercel.json` is required.
3. Do **not** deploy yet — first add the environment variables (next step), since several pages query the
   database during the build itself (`getStaticProps`).

## 3. Set environment variables

In **Project Settings → Environment Variables**, add every variable from `ENVIRONMENT.md`. At minimum, for
the site to build and function:

- `DATABASE_URL`
- `SESSION_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`

Add `NEXT_PUBLIC_SITE_URL` (your real production domain) and `NEXT_PUBLIC_SSP_PER_USD` too — both have safe
fallbacks but should be set before real traffic arrives. Add the Cloudinary, Odoo, and AI variables if/when
you're ready to enable those subsystems (all are safe to leave unset — each subsystem degrades gracefully
to "disabled" rather than erroring).

**Important:** tick **Production, Preview, and Development** for each variable (not just Production).
Because pages are statically generated at build time against the live database, a Preview-branch build
with `DATABASE_URL` scoped only to Production will fail or silently render placeholder data.

## 4. Deploy

1. Trigger the deployment (push to `main`, or click **Deploy** in the Vercel dashboard).
2. Watch the build logs. On a fresh install, `npm install` runs first — this fires the `postinstall` script
   (`prisma generate`), which regenerates the Prisma client into `lib/generated/prisma` (gitignored, so it
   must always be regenerated at install time; this is why `postinstall` exists in `package.json`). If you
   ever see "Cannot find module '@/lib/generated/prisma/client'" in a build log, `postinstall` failed to run
   or `DATABASE_URL`/Prisma's schema URL isn't reachable at build time — check that first.
3. Once deployed, log into `/admin` with `ADMIN_EMAIL` / the password you hashed in step 1, and immediately
   create your real admin account(s) from `/admin/users` with proper roles (Super Admin, Admin, Sales,
   Warehouse, Delivery).

## 5. Post-deploy verification checklist

- [ ] Homepage, category pages, and product detail pages load with real data (not placeholder/empty state).
- [ ] Product images load from Cloudinary (if configured) — check the browser console for image errors.
- [ ] `/admin` login works with the break-glass credentials, then with a freshly created real admin account.
- [ ] If Odoo sync is enabled (`ODOO_SYNC_ENABLED=true`): Admin → Odoo → "Test connection" succeeds, and a
      test product/order round-trips correctly. If sync is left off, confirm the storefront still runs
      correctly in local/mock mode (products from `data/products.js`).
- [ ] If Cloudinary is configured: upload a product image from the admin dashboard and confirm it renders.
- [ ] If the AI system is enabled: confirm `/admin/ai` shows suggestions generating, and that
      `AI_MODE=suggest_only` is actually enforced (suggestions apply only after explicit admin approval).
- [ ] Check response headers on any page — confirm `X-Powered-By` is absent (`poweredByHeader: false` in
      `next.config.mjs`).

## 6. Ongoing schema changes

Whenever `prisma/schema.prisma` changes:

```bash
npx prisma db push          # sync the change to production DATABASE_URL
```

Run this against production **before** deploying code that depends on the new schema shape, since Vercel's
build-time `getStaticProps` calls will otherwise query a database that doesn't match the code yet.

## Rollback

Vercel keeps every previous deployment. If a deploy causes problems, use **Deployments → (previous
deployment) → Promote to Production** in the Vercel dashboard to instantly roll back — no redeploy needed.
Note this only rolls back the application code; if the bad deploy included a schema change already pushed
with `prisma db push`, you'll need to manually revert the schema change separately, since Prisma schema
state isn't tied to a specific Vercel deployment.
