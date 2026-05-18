# In-Depth Vercel Deployment & Cost Blueprint

This document explains the production deployment pipeline, serverless PostgreSQL integration, cost projections, and configuration steps for hosting the **LLM Benchmarks Database (llmdb)** on Vercel.

---

## 🚀 1. The Vercel Deployment Process

Vercel is the native cloud hosting platform developed by the creators of Next.js. It operates on a Git-backed serverless architecture, meaning you do not manage virtual machines, operating system patches, or manual web servers.

### A. The Git-Triggered Release Cycle
Deployment is completely automated and tied directly to your GitHub repository:

```
[Push to feature/*] ──➔ [Vercel builds temporary preview URL] ──➔ [Test in PR]
                                                                        │
[Squash & Merge dev] ◄──────────────────────────────────────────────────┘
         │
[Push/Merge to main] ──➔ [Vercel triggers production build] ──➔ [Live to custom domain]
```

1.  **Preview Deployments**: Every time a developer opens a Pull Request on GitHub, Vercel automatically compiles the build and provisions a isolated, temporary environment with a unique URL (e.g., `llmdb-git-feature-browse-vercel.app`). Reviewers can test changes live before code is merged.
2.  **Production Deployments**: When code is pushed or merged into the `main` branch, Vercel compiles a production build. Next.js server components are compiled into isolated **Serverless/Edge Functions**, static pages are pre-rendered for maximum performance, and resources are deployed globally across Vercel's Edge Network CDN.

---

## 💾 2. Serverless PostgreSQL Hosting

Because Vercel operates on serverless functions (which spin up and down dynamically), a traditional PostgreSQL server can quickly run out of database connections when traffic spikes.

### A. Recommended Cloud Database Providers
We recommend pairing Vercel with serverless-optimized PostgreSQL databases that support connection pooling (PgBouncer) and scale-to-zero compute:

1.  **Neon.tech (Highly Recommended)**: A serverless Postgres provider that separates storage and compute. Compute nodes automatically "freeze" when inactive (consuming $0 cost) and wake up in less than 500ms when a query hits them.
2.  **Supabase**: A comprehensive Postgres-as-a-service provider that includes built-in connection poolers.

### B. Connection Pooling with Drizzle ORM
In serverless functions, always use the Neon connection pooler URL or Supabase transaction pooler URL (port `5432` or `6543`) to prevent functions from exhausting database connections:

```typescript
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Enables HTTP query pipelining (highly optimized for serverless functions)
neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

---

## 💰 3. Detailed Cost Modeling

You can host and run the entire Core Viable Product (CVP) of LLMDB for **$0 / month** using modern free-tier allowances.

### Cost Breakdown Ledger

| Service Layer | Provider | Active Tier | Monthly Cost | What's Included / Limits |
| :--- | :--- | :--- | :--- | :--- |
| **Next.js & Frontend** | Vercel | Hobby Tier | **$0.00** | 100 GB bandwidth, 6,000 build minutes, global SSL, unlimited preview URLs. |
| **PostgreSQL Database** | Neon.tech | Free Tier | **$0.00** | 1 Active Project, 0.5 GB SSD storage (holds ~100,000 benchmark records), auto-suspend. |
| **User Authentication** | NextAuth | Self-Hosted | **$0.00** | Handled natively inside Next.js via serverless OAuth (GitHub/Google logins). |
| **Custom Domain** | Namecheap/Porkbun | Standard | **~$10.00 / year** | Custom domain mapping (e.g. `llmdb.com`). |

### When to Upgrade (Scaling Options)
- **Vercel Pro ($20/user/month)**: Necessary if bandwidth exceeds 100 GB/month or if we need team collaboration controls.
- **Neon Launch Tier ($19/month)**: Necessary if database storage exceeds 0.5 GB or if we want persistent compute nodes that never sleep.

---

## 📋 4. Step-by-Step Launch Checklist

When you are ready to deploy the Next.js application live:

1.  **Create GitHub Repository**: Push the `llmdb` project workspace folder to a private or public GitHub repo.
2.  **Sign Up on Vercel**: Go to [Vercel.com](https://vercel.com) and sign in using your **GitHub account**.
3.  **Import Project**:
    - Click **"Add New"** ➔ **"Project"**.
    - Find your `llmdb` repository in the list and click **"Import"**.
4.  **Configure Build Settings**:
    - Vercel automatically detects Next.js and configures the build command (`next build`) and output directory (`.next`). Keep these at their defaults.
5.  **Inject Environment Variables**:
    - Expand the **"Environment Variables"** tab.
    - Copy the keys from your local `.env.local` and paste them here:
        *   `DATABASE_URL` (From your Neon or Supabase console)
        *   `NEXTAUTH_SECRET` (Generate a secure 32-character key)
        *   `NEXTAUTH_URL` (Set to `https://your-app-name.vercel.app`)
        *   `GITHUB_ID` & `GITHUB_SECRET`
6.  **Click Deploy**: Vercel will build the codebase, provision the edge servers, and launch your site live with an SSL-secured `*.vercel.app` domain in less than 2 minutes!
7.  **Map your Custom Domain (`llmdb.org`)**:
    - Go to your Vercel Project dashboard ➔ **Settings** ➔ **Domains**.
    - Type **`llmdb.org`** and click **"Add"**. Vercel will automatically suggest adding both `llmdb.org` and a redirecting `www.llmdb.org` alias.
    - Log into your domain registrar's DNS panel (e.g. Porkbun, Namecheap, GoDaddy) and add the following two records:
        
        | Record Type | Host / Name | Value / Target | Purpose |
        | :--- | :--- | :--- | :--- |
        | **`A`** | `@` (or blank) | **`76.76.21.21`** | Points the apex domain (`llmdb.org`) directly to Vercel's global CDN. |
        | **`CNAME`** | `www` | **`cname.vercel-dns.com`** | Points the subdomain (`www.llmdb.org`) to Vercel's DNS router. |

    - Once added, Vercel will verify the DNS connection, issue a secure global **SSL certificate**, and make your community catalog live at **`https://llmdb.org`**!

