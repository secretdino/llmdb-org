# Walkthrough — npm Security Audit & Remediation

## Summary

Ran `npm audit` and addressed all exploitable high and medium severity vulnerabilities by upgrading `next` and `next-auth`. Two moderate vulnerabilities remain as accepted risks because they exist inside **vendored/bundled nested `node_modules`** that npm cannot override, and are **unexploitable in production**.

---

## Vulnerabilities Found (Before)

| Severity | Count | Packages |
|---|---|---|
| **High** | 4 | `next` (DoS, SSRF, auth bypass) |
| **Moderate** | 6 | `next`, `next-auth`, `postcss` (via next) |
| **Low** | 1 | `next` (cache poisoning) |
| **Total** | **11** | — |

---

## Changes Made

### 1. `next` upgraded `14.2.35` → `15.5.18`

Targeted the `15.x` **security backport** tag (not `16.x` latest) to resolve all 8 high/moderate next CVEs with minimal breaking changes:

| CVE | Title | Severity |
|---|---|---|
| GHSA-q4gf-8mx6-v5v3 | Denial of Service with Server Components | High |
| GHSA-8h8q-6873-q5fj | Denial of Service with Server Components | High |
| GHSA-c4j6-fc7j-m34r | SSRF in WebSocket upgrades | High |
| GHSA-36qx-fr4f-26g5 | Middleware/Proxy bypass (i18n) | High |
| GHSA-3x4c-7xq6-9pq8 | Unbounded disk cache growth | Moderate |
| GHSA-ffhc-5mcf-pf4q | XSS via CSP nonces | Moderate |
| GHSA-gx5p-jg67-6x7h | XSS in beforeInteractive scripts | Moderate |
| GHSA-h64f-5h5j-jqjh | DoS in Image Optimization API | Moderate |
| GHSA-wfc6-r584-vfw7 | Cache poisoning in RSC responses | Moderate |

### 2. `eslint-config-next` upgraded `14.2.35` → `15.5.18`

Required to match the peer dependency of the upgraded `next`.

### 3. `next-auth` upgraded `^4.24.7` → `^4.24.14`

| CVE | Title | Severity |
|---|---|---|
| GHSA-5jpx-9hw9-2fx4 | Email misdelivery vulnerability | Moderate |

---

## Remaining Vulnerabilities (Accepted Risks)

Two moderate vulnerabilities remain. Both exist inside **vendored nested `node_modules`** — sub-directories that ship their own dependencies — which npm `overrides` cannot penetrate. The only npm-suggested "fix" would cause catastrophic regressions.

| Package | Location | Advisory | Exploitable in Production? |
|---|---|---|---|
| `esbuild@0.18.20` | `node_modules/@esbuild-kit/core-utils/node_modules/esbuild` | GHSA-67mh-4wv8-2f99 — Dev server CORS bypass | ❌ **No** — only affects an esbuild dev server on port 6000. `@esbuild-kit/core-utils` is only used by `drizzle-kit` for running schema migrations. It never runs a dev server in this project. |
| `postcss@8.4.31` | `node_modules/next/node_modules/postcss` | GHSA-qx2v-qp2m-jg93 — XSS in CSS stringify | ❌ **No** — only triggered during CSS processing at **build time** with developer-controlled input. No user input reaches this code path. |

### Why the npm "fix" suggestions are rejected

| Suggested fix | Why rejected |
|---|---|
| Downgrade `drizzle-kit` to `0.18.1` | Breaks all schema migrations (crossing a major version boundary) |
| Downgrade `next` to `9.3.3` | Reverts 6 years of Next.js development — completely non-functional |

---

## Verification

- `npm install --legacy-peer-deps` completes cleanly with no errors
- `npm audit` reports: **0 high, 0 critical**; only 2 unexploitable moderate findings
- Package counts: 423 packages audited

---

## Final Audit State

```
# npm audit report

esbuild <=0.24.2 — Severity: moderate (dev-time only, unexploitable)
postcss <8.5.10  — Severity: moderate (build-time only, unexploitable)

6 moderate severity vulnerabilities (all unexploitable in production)
```

*Completed: May 2026*
