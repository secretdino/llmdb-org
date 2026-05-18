# Third-Party Software Attributions

This document lists the open-source software packages used in the **LLM Benchmarks Database (llmdb)** repository, along with their respective licenses and homepages. We are extremely grateful to the authors and maintainers of these projects for their contributions to the open-source ecosystem.

---

## 🚀 Core Application & UI Framework

### [Next.js](https://nextjs.org/)
* **License**: [MIT License](https://github.com/vercel/next.js/blob/canary/LICENSE)
* **Description**: React Framework for the Web.
* **Usage in LLMDB**: Server-side rendering (SSR), API routes, App Router layouts, and static page compile optimizations.

### [React & React DOM](https://react.dev/)
* **License**: [MIT License](https://github.com/facebook/react/blob/main/LICENSE)
* **Description**: A JavaScript library for building user interfaces.
* **Usage in LLMDB**: Component tree state management, client-side hydration, and dynamic reactive UI components.

---

## 🗄️ Database & DDL Tools

### [Drizzle ORM](https://orm.drizzle.team/)
* **License**: [Apache-2.0 License](https://github.com/drizzle-team/drizzle-orm/blob/main/LICENSE)
* **Description**: Next-generation TypeScript ORM for SQL databases.
* **Usage in LLMDB**: Database schema definitions, transaction-insulated queries, seeding scripts, and data deduplication logic.

### [@neondatabase/serverless](https://neon.tech/)
* **License**: [MIT License](https://github.com/neondatabase/serverless/blob/main/LICENSE)
* **Description**: Serverless driver for Neon Postgres.
* **Usage in LLMDB**: Connection pooling and HTTP-based query execution optimized for serverless edge contexts.

### [pg (node-postgres)](https://node-postgres.com/)
* **License**: [MIT License](https://github.com/brianc/node-postgres/blob/master/LICENSE)
* **Description**: PostgreSQL client for Node.js.
* **Usage in LLMDB**: Local development pooled connection driver.

---

## 🔐 Security & User Authentication

### [NextAuth.js (Auth.js)](https://next-auth.js.org/)
* **License**: [ISC License](https://github.com/nextauthjs/next-auth/blob/main/LICENSE)
* **Description**: Flexible, lightweight authentication framework for Next.js.
* **Usage in LLMDB**: Credentials verification, session JWT signing, and GitHub OAuth onboarding hooks.

### [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
* **License**: [MIT License](https://github.com/dcodeIO/bcrypt.js/blob/master/LICENSE)
* **Description**: Optimized bcrypt password salting and hashing implementation in pure JavaScript.
* **Usage in LLMDB**: Salted password verification for local developer users and the system admin seeder.

---

## 🛠️ Schema Validation & Assets

### [Zod](https://zod.dev/)
* **License**: [MIT License](https://github.com/colinhacks/zod/blob/master/LICENSE.md)
* **Description**: TypeScript-first schema validation with static type inference.
* **Usage in LLMDB**: Ingestion API input validation, console log parser safety gates, and signup guard assertions.

### [Lucide React](https://lucide.dev/)
* **License**: [ISC License](https://github.com/lucide-dev/lucide/blob/main/LICENSE)
* **Description**: Beautiful, consistent, open-source icon pack.
* **Usage in LLMDB**: UI dashboard, profile indicators, upvote signals, and status state representations.

---

## 🧪 Developer Tooling & Verification

* **[TypeScript](https://www.typescriptlang.org/)** (Apache-2.0 License) — Used to guarantee compilation safety and robust static type definitions.
* **[Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)** (Apache-2.0 License) — CLI tool for SQL migrations mapping.
* **[Tailwind CSS](https://tailwindcss.com/)** (MIT License) — Utility-first CSS framework for custom glassmorphism and modern visual themes.
* **[dotenv](https://github.com/motdotla/dotenv)** (MIT License) — Loads environment configurations for sandbox scripts.
* **[tsx (esbuild runner)](https://github.com/privatenumber/tsx)** (MIT License) — Executes seeding scripts directly from the terminal.
* **[pg-mem](https://github.com/oguimbal/pg-mem)** (MIT License) — In-memory PostgreSQL instance used for rapid, isolated endpoint integration tests.
