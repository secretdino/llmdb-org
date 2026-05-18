# LLMDB Developer Guide & Contribution Specification

This document provides clear, mandatory guidelines for local development, coding standards, testing, git branching, Pull Requests, secrets management, and automated pipelines across the **LLM Benchmarks Database (llmdb)**.

---

## 🛠️ 1. Local Development Setup

### A. Core Requirements
- **Node.js**: `v20.x` or later (LTS)
- **PNPM**: Preferred package manager (`pnpm install`)
- **Docker**: For running a local PostgreSQL container

### B. Bootstrapping Database
Run a local PostgreSQL instance:
```bash
docker run --name llmdb-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=llmdb -p 5432:5432 -d postgres:16-alpine
```

Execute schema synchronization using Drizzle ORM:
```bash
# Generate SQL migrations
pnpm db:generate

# Apply migrations to local database
pnpm db:migrate

# Start Drizzle Studio dashboard
pnpm db:studio
```

---

## 🌿 2. Git Branching & Conventional Commits

We follow a strict trunk-based branching workflow to maintain pipeline stability.

### A. Branch Naming Conventions

| Branch Type | Syntax | Example |
| :--- | :--- | :--- |
| **Main Release** | `main` | `main` |
| **Development** | `dev` | `dev` |
| **Features** | `feature/FEAT-<id>-<slug>` | `feature/FEAT-002-browse-filter` |
| **Bug Fixes** | `bugfix/<issue-id>-<slug>` | `bugfix/142-vulcan-timings-parse` |
| **Documentation** | `docs/<slug>` | `docs/developer-guide-setup` |

### B. Commits Standard (Conventional Commits)
All commit messages must follow the Angular commit guidelines.
```
<type>(<scope>): <short summary>
```

- **`feat`**: A new feature (e.g., `feat(parser): detect speculative MLA attributes`)
- **`fix`**: A bug fix (e.g., `fix(ui): adjust profile save alignment`)
- **`test`**: Adding missing tests (e.g., `test(parser): verify ROCm timing inputs`)
- **`docs`**: Documentation adjustments (e.g., `docs(dev): compile secrets guide`)
- **`refactor`**: Code changes that neither fix bugs nor add features.

---

## 📥 3. Pull Request (PR) Lifecycle

### A. Preparation Checklist
Before opening a PR, the contributor must run the validation checklist locally:
1. **Lint Checks**: `pnpm lint` must pass with zero warnings.
2. **Type Checking**: `pnpm typecheck` (tsc compilation) must succeed.
3. **Tests Validation**: `pnpm test` (Vitest) must pass 100% of cases.
4. **Migration Check**: Ensure all new DB columns are captured in generated migration files.

### B. Review & Merging Requirements
- **Approvals**: At least **1 Senior Reviewer approval** is mandatory before merge.
- **CI Pipelines**: The GitHub Actions runner must complete successfully (green status).
- **Merge Strategy**: Always use **Squash and Merge** to keep the git history clean and readable.

---

## 🧪 4. Testing Architecture (Vitest & RTL)

All logic, particularly log parsing and database trust scoring, must be covered by thorough tests.

### A. Framework Stack
- **Unit Testing**: [Vitest](https://vitest.dev/) (fast, Next.js integrated)
- **Component Testing**: React Testing Library (RTL)

### B. Test File Conventions
- Place test files immediately adjacent to their target units using the format `<file>.test.ts` or `<file>.test.tsx`.
- Mock external database dependencies using Vitest's mocking engine instead of hitting live databases.

### C. Example Unit Test (Mocking Drizzle Database)
```typescript
import { describe, it, expect, vi } from 'vitest';
import { insertBenchmark } from './benchmark_service';
import { db } from '@/db';

// Mock the drizzle db instance
vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([{ id: 'mock-id-123' }])
    })
  }
}));

describe('benchmark_service', () => {
  it('should insert benchmark and return id', async () => {
    const payload = { model_name: 'DeepSeek-V3', confidence_score: 0.98 };
    const result = await insertBenchmark(payload);
    
    expect(db.insert).toHaveBeenCalled();
    expect(result).toEqual({ id: 'mock-id-123' });
  });
});
```

---

## 🔑 5. Secrets & Configurations Management

### A. Environment Configuration Safety
- **Strict Rule**: **NEVER** commit `.env` or `.env.local` files to git.
- **Reference Template**: Always maintain and update `env.example` in the root repository folder, listing keys with empty placeholder values.
- **Production Secrets**: Store credentials securely in target host managers (e.g. Vercel dashboard, AWS Parameter Store, Fly secrets vault).

### B. Mandatory Local Environment Variables
Create a local `.env.local` file:
```env
# Database connection (Development Container)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/llmdb"

# NextAuth authentication secrets
NEXTAUTH_SECRET="your-32-character-random-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Oauth Identifiers for logins
GITHUB_ID="mock_github_client_id"
GITHUB_SECRET="mock_github_client_secret"

# Trust and Quality assurance configurations
ADMIN_API_KEY_SALT="secure-crypto-salt-key"
```

---

## 🤖 6. Continuous Integration (CI) Actions Pipeline

We utilize GitHub Actions to automate code validation on every commit pushed and PR created.

Add the following pipeline configuration file to `.github/workflows/ci.yml`:
```yaml
name: LLMDB Continuous Integration

on:
  push:
    branches: [ main, dev ]
  pull_request:
    branches: [ main, dev ]

jobs:
  validate:
    name: Lint, Test & Compile Build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install PNPM Package Manager
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Install Project Dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint Analysis
        run: pnpm lint

      - name: TypeScript Compile Test
        run: pnpm typecheck

      - name: Execute Vitest Suites
        run: pnpm test --run

      - name: Build Next.js Production bundle
        run: pnpm build
```
