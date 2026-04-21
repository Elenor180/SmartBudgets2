# Environment Variables

This app has two environment scopes:

## 1) Frontend (`Vite`)

Use `.env.local` for local development.

Required:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Reference file: `.env.example`.

Important:

- Only place browser-safe values in `VITE_*` variables.
- Never place `service_role`, Gemini keys, or any private API key in frontend env files.

## 2) Supabase Edge Functions / Server

Current `ai-advisor` function expects:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- Optional: `SB_JWT_ISSUER`

Manage these in Supabase secrets, not in repo files:

```bash
supabase secrets set GEMINI_API_KEY=... --project-ref <project-ref>
```
