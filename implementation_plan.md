# BizCore Admin Dashboard — Implementation Plan

## Overview
Production-ready Next.js 15/16 admin dashboard with Auth.js v5, Zustand 5, Tailwind CSS v4, and a Forest Green design system.

## Execution Phases

### Phase 1 — Project Init (create-next-app + pnpm deps)
### Phase 2 — Tailwind & CSS config (forest green color system)
### Phase 3 — Folder structure scaffold
### Phase 4 — Auth.js v5 (credentials provider, JWT strategy)
### Phase 5 — Middleware (route protection, RBAC)
### Phase 6 — Zustand stores (auth + UI/theme)
### Phase 7 — UI utilities (cn helper)
### Phase 8 — Auth pages (login, register)
### Phase 9 — Dashboard layout (Sidebar + Topbar)
### Phase 10 — Dashboard pages (KpiCard, admin, user)
### Phase 11 — Root redirect & root layout
### Phase 12 — Env + next.config.ts
### Phase 13 — Verify build/dev

## Key Design Decisions
- App Router with route groups: `(auth)` and `(dashboard)`
- Next-auth v5 beta with credentials provider + JWT sessions
- Zustand with immer + persist middleware
- IBM Plex Sans font (user specified) — will use next/font/google
- Forest green sidebar, light/dark surface tokens via Tailwind v4
