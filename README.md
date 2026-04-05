# Smart Budgets Workspace

Smart Budgets Workspace is a Vite + React frontend for personal finance planning. The active application lives under `src/` and is now wired for Supabase-backed authentication plus persisted customer finance records.

## Current scope

- Email/password authentication with Supabase Auth
- Customer profile creation and persisted workspace setup
- Dashboard, transactions, budgets, goals, reminders, insights, and settings
- Remote persistence for finance records plus JSON export/import
- Responsive shell and chart-driven finance views

## Tech stack

- React 19
- TypeScript
- Vite
- React Router
- Recharts
- Lucide React
- Supabase Auth + Postgres

## Getting started

```bash
npm install
npm run dev
```

The development server runs on `http://localhost:3000` by default.

## Supabase setup

Local environment variables:

```bash
cp .env.example .env.local
```

Required variables:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Database schema:

- Local Supabase config lives in `supabase/config.toml`
- The initial schema lives in `supabase/migrations/20260405195000_initial_workspace_schema.sql`
- The migration creates auth-linked `profiles`, plus `budgets`, `transactions`, `goals`, and `reminders` tables with row-level security

To push the migration to a hosted project, link the project with the Supabase CLI using a personal access token or database password, then run `supabase db push`.

## Scripts

```bash
npm run dev
npm run typecheck
npm run build
npm run preview
```

## Project structure

```text
src/
  app/        Application shell, routing, and state provider
  domain/     Typed finance models, defaults, and selectors
  features/   Route-level screens
  integrations/
    supabase/ Typed client and repository layer
  lib/        Formatting and persistence helpers
  ui/         Shared UI primitives
```

## Notes

- The old root-level app and legacy component tree have been removed.
- The service-role key must stay off the frontend. Only the anon key belongs in Vite env vars.
