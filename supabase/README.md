# Backend (Supabase) — Traveloop

This directory contains the **entire backend** of Traveloop. It is a real,
production-grade Postgres + serverless setup that anyone can spin up in a fresh
Supabase project in minutes.

```
supabase/
├── config.toml          # Project config (function-level settings)
├── schema.sql           # ⭐ Single-file consolidated schema (read this first)
├── migrations/          # Timestamped migrations — actual source of truth
│   ├── 20260510091654_*.sql   # Tables, enums, RLS, functions, triggers
│   ├── 20260510091716_*.sql   # search_path hardening for SECURITY DEFINER fns
│   └── 20260510092836_*.sql   # profiles: plan / plan_expires_at / notes
└── functions/           # Deno edge functions (serverless)
    ├── generate-trip/        # AI itinerary generator
    └── trip-suggestions/     # Real-time SSE suggestions
```

## What's in the database

| Table | Purpose | RLS |
|---|---|---|
| `profiles` | Per-user profile, plan, ban-flag, admin notes | ✅ |
| `user_roles` | Roles (`admin` / `user`) — separate table to prevent privilege escalation | ✅ |
| `trips` | Full trip JSONB payload, indexed by `user_id` and `updated_at` | ✅ |
| `site_settings` | Key-value site config (e.g. `admin_emails` whitelist) | ✅ |

**All tables have Row-Level Security enabled.** Users can only access their own
rows; admins (verified server-side via `has_role()`) can moderate everything.

## Database functions

| Function | Type | Purpose |
|---|---|---|
| `has_role(uuid, app_role)` | `STABLE SECURITY DEFINER` | Safe role check used inside RLS — avoids recursive policy evaluation |
| `handle_new_user()` | `TRIGGER` on `auth.users` | Auto-creates profile + default role; promotes to admin if email is in `site_settings.admin_emails` |
| `tg_set_updated_at()` | `TRIGGER` | Touch `updated_at` on every row update |

All `SECURITY DEFINER` functions pin `search_path = public` to defend against
search-path hijacking.

## Edge Functions

Both functions are written in **Deno (TypeScript)** and call any
**OpenAI-compatible** AI gateway (configurable via env vars).

| Function | Purpose | Auth |
|---|---|---|
| `generate-trip` | Free-text prompt → structured itinerary JSON | JWT verified |
| `trip-suggestions` | Destination-aware tips, streamed via SSE | JWT verified |

### Required secrets (set in Supabase → Settings → Edge Functions → Secrets)

| Secret | Required | Default |
|---|---|---|
| `AI_GATEWAY_KEY` | ✅ | — |
| `AI_GATEWAY_URL` | optional | provider default |
| `AI_MODEL` | optional | `google/gemini-3-flash-preview` |
| `SUPABASE_URL` | auto | — |
| `SUPABASE_ANON_KEY` | auto | — |
| `SUPABASE_SERVICE_ROLE_KEY` | auto | — |

## Apply the schema to a fresh Supabase project

### Option A — Supabase CLI (recommended)
```bash
supabase link --project-ref <your-project-ref>
supabase db push
supabase functions deploy generate-trip
supabase functions deploy trip-suggestions
```

### Option B — One-shot via SQL editor
Open `supabase/schema.sql` in the Supabase SQL editor and run it. Then deploy
the edge functions from the dashboard (or via CLI).

## Security checklist (already enforced)

- [x] RLS enabled on every user-owned table
- [x] Roles in dedicated `user_roles` table, never on `profiles`
- [x] All admin checks go through `has_role()` server-side
- [x] `SECURITY DEFINER` functions have `search_path` pinned
- [x] Edge functions verify the JWT before calling AI providers
- [x] AI gateway keys live as edge-function secrets — never shipped to the browser
- [x] Email confirmation required for sign-up
