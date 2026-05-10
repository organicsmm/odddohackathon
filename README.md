# 🌍 Traveloop — Personalized Travel Planning Made Easy

> Cinematic, intelligent, and collaborative travel planning. Dream it, design it, share it.

**Live demo:** https://odddohackathon.lovable.app

---

## ✨ Vision

Traveloop is a personalized, intelligent, and collaborative platform that transforms the way individuals plan and experience travel. We empower users to **dream, design, and organize trips** with ease — combining flexibility, interactivity, and beautiful design so that planning a trip feels as exciting as the trip itself.

## 🎯 Mission

Build a user-centric, responsive application that simplifies multi-city travel planning by giving travelers intuitive tools to:

- Add and manage travel stops and durations
- Explore cities and activities of interest
- Estimate trip budgets automatically
- Visualize timelines and day-wise plans
- Share trip plans publicly or with friends

## 🧩 Problem Statement

Design and develop a complete travel planning application where users can:

- Create customized **multi-city itineraries**
- Assign **travel dates, activities, and budgets**
- Discover activities and destinations through search
- Receive **cost breakdowns and visual calendars**
- Share their plans **publicly or with friends**

The system uses a relational database to store complex travel data (users, trips, stops, activities, expenses) and provides dynamic UIs that adapt to each user's trip flow.

---

## 🚀 Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Login / Signup** | Email + password authentication, Google OAuth, validation. |
| 2 | **Dashboard** | Welcome hub with recent trips, recommended cities, budget highlights, quick "Plan New Trip". |
| 3 | **Create Trip** | Start a trip with name, dates, description, optional cover photo, budget in ₹ INR. |
| 4 | **My Trips** | Card list of all trips with destination count, date range, edit/view/delete. |
| 5 | **Itinerary Builder** | Add stops, pick cities, assign dates & activities, reorder cities. |
| 6 | **Itinerary View** | Day-wise visual itinerary with activity blocks, time, and cost. |
| 7 | **City Search** | Curated catalog of famous **Indian cities** with photos, filters and one-click add. |
| 8 | **Activity Search** | Browse activities by type, cost, duration; quick add/remove with images. |
| 9 | **Budget & Cost Breakdown** | Auto-calculated costs (stay, meals, transport, activities) with charts and daily averages. |
| 10 | **Packing Checklist** | Categorized checklist (clothing, documents, etc.) with packed status. |
| 11 | **Public / Shared Itinerary** | Read-only public link, copy-trip option, social sharing. |
| 12 | **Friends & Invites** | Invite friends to collaborate on a trip via secure tokens. |
| 13 | **Profile / Settings** | Editable profile, language preference, saved destinations, account deletion. |
| 14 | **Trip Notes / Journal** | Add timestamped notes per trip or per day. |
| 15 | **🤖 AI Trip Generator** | Describe your vibe → get a fully-built itinerary in seconds (Lovable AI / Gemini). |
| 16 | **🧠 Real-time Trip Suggestions** | Based on your destination, AI suggests packing items & local tips contextually. |
| 17 | **💱 Multi-currency Support** | Live FX rates; default INR with switcher (USD, EUR, GBP, JPY, AED, etc.). |
| 18 | **🛡️ Admin Panel** | Analytics, user management (ban/admin/delete), full user details, subscription plan management (Free / Pro / Premium), trip moderation. |

---

## 🛠️ Tech Stack

**Frontend**
- ⚛️ **React 18** + **TypeScript 5**
- ⚡ **Vite 5** (with code-splitting, manual vendor chunks, lazy routes)
- 🎨 **Tailwind CSS v3** + custom HSL design tokens
- 🧱 **shadcn/ui** + **Radix UI** primitives
- 🔀 **React Router v6**
- 🔄 **TanStack Query** (with tuned caching)
- 🎭 **Lucide Icons**

**Backend (Lovable Cloud — managed Supabase)**
- 🗄️ **PostgreSQL** with Row-Level Security (RLS)
- 🔐 **Supabase Auth** (email/password + Google OAuth)
- ⚡ **Edge Functions** (Deno) for AI features
- 📦 **Storage** for trip cover photos
- 🔔 **Realtime** subscriptions

**AI**
- 🤖 **Lovable AI Gateway** (Google Gemini 2.5 Flash / Pro)
- Edge functions: `generate-trip`, `trip-suggestions`

**Tooling**
- ESLint, Vitest, Husky pre-commit hooks
- GitHub Actions for typecheck CI

---

## 🗂️ Project Structure

```
src/
├── components/         # Reusable UI (shadcn + custom)
│   ├── ui/             # shadcn primitives
│   ├── HeroSlider.tsx
│   ├── TripSuggestions.tsx
│   ├── AiTripGenerator.tsx
│   └── ...
├── contexts/           # React contexts (AuthContext)
├── hooks/              # Custom hooks (use-trips, use-toast)
├── integrations/
│   └── supabase/       # Auto-generated client + types
├── layouts/            # AppLayout, AdminLayout
├── lib/                # Pure logic: store, catalog, currency, types
├── pages/              # Route pages
│   └── admin/          # Admin panel pages
└── App.tsx             # Lazy-loaded routes
supabase/
├── functions/          # Edge functions (AI)
├── migrations/         # SQL migrations
└── config.toml
```

---

## 🧰 Use Case → Technology Used

| Use Case / Feature | Technology Used |
|---|---|
| User authentication (email + Google OAuth) | **Supabase Auth** + `AuthContext` (React Context) |
| Role-based admin panel | `user_roles` table + `has_role()` SECURITY DEFINER + RLS |
| Multi-city itinerary builder | React state + `lib/store.ts` + cloud sync to `trips` |
| Cloud trip persistence & cross-device sync | **Supabase Postgres** `trips` table (JSONB payload) |
| Public / shared trip view | `shareId` field + RLS read policy + `/share/:id` route |
| Friends & invites | Token-based invites stored on trip JSON, accepted via `/invite/:token` |
| AI Trip Generator | Edge function `generate-trip` → **Lovable AI Gateway** (Gemini 2.5 Flash) |
| Real-time destination suggestions | Edge function `trip-suggestions` → Lovable AI Gateway |
| Multi-currency conversion | `lib/currency.ts` + open.er-api.com live FX (24 h cached) |
| Budget breakdown + charts | Pure TS `tripCost()` + Recharts |
| Cinematic UI | Tailwind v3 + HSL design tokens + Radix / shadcn primitives |
| Routing + lazy loading | React Router v6 + `React.lazy` + `Suspense` |
| Server state caching | TanStack Query (60 s stale, no focus refetch) |
| Offline-first behavior | LocalStorage mirror in `lib/store.ts` + cloud upsert on change |
| Admin user management | RLS "Admins update/delete any" + admin-only UI guards |
| Type safety end-to-end | TypeScript 5 + auto-generated `supabase/types.ts` |

---

## 🗃️ Database Schema

Four tables, all protected by Row-Level Security (RLS).

### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `user_id` | uuid | Links to `auth.users.id` |
| `email` | text | |
| `display_name` | text | |
| `avatar_url` | text | |
| `plan` | text | `free` \| `pro` \| `premium` |
| `plan_expires_at` | timestamptz | Subscription expiry |
| `banned` | boolean | Admin moderation |
| `notes` | text | Admin-only notes |

### `user_roles`
**Separate table** to prevent privilege escalation — never store roles on `profiles`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | Links to `auth.users.id` |
| `role` | `app_role` enum | `admin` \| `user` |

### `trips`
Cloud-synced trip data; JSONB payload mirrors local store.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | Owner |
| `client_trip_id` | text | Local store ID for upsert |
| `name`, `start_date`, `end_date` | text / date | |
| `data` | jsonb | Full trip object (stops, packing, notes, budget, invites) |

### `site_settings`
Key-value site-wide config (e.g. `admin_emails` whitelist). Public read, admin-only write.

### Database Functions
- **`has_role(_user_id, _role)`** — `SECURITY DEFINER`, used inside RLS to safely check roles without recursion.
- **`handle_new_user()`** — Trigger on `auth.users` insert; creates profile, assigns default `user` role, auto-promotes to `admin` if email is in `site_settings.admin_emails`.
- **`tg_set_updated_at()`** — Generic `updated_at` touch trigger.

---

## 🛡️ Row-Level Security (RLS)

Every table has RLS **enabled**.

**`profiles`** — Authenticated users read all; users insert/update only their own; admins update/delete any.
**`user_roles`** — Users view own roles; admins fully manage all roles.
**`trips`** — Users full CRUD on their own trips; admins SELECT / UPDATE / DELETE any.
**`site_settings`** — Public read; admin-only write.

> All admin checks go through `has_role(auth.uid(), 'admin')` — never trust the client.

---

## ⚡ Edge Functions (Serverless, Deno)

### `generate-trip`
- **Purpose:** Generate complete itinerary from a free-text prompt.
- **Input:** `{ prompt, days?, budget? }`
- **Flow:** Verify auth → Lovable AI Gateway (Gemini 2.5 Flash) → structured JSON (stops, activities, packing).

### `trip-suggestions`
- **Purpose:** Real-time contextual recommendations (packing, local tips, must-see) for a destination.
- **Input:** `{ destination, dates? }`
- **Flow:** Build prompt → Lovable AI Gateway → suggestions stream back to `TripSuggestions.tsx`.

### Edge Function Secrets
`LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`.

---

## 🤖 AI Integration

| Aspect | Details |
|---|---|
| Provider | **Lovable AI Gateway** (no user API key needed) |
| Default model | `google/gemini-2.5-flash` — fast, multimodal, low-cost |
| Heavy-prompt fallback | `google/gemini-2.5-pro` |
| Where called | Edge functions only — keys never exposed to browser |
| UI integration | `AiTripGenerator.tsx`, `TripSuggestions.tsx` |

---

## 🔗 Live Demo

| Environment | URL |
|---|---|
| 🚀 **Production** | https://odddohackathon.lovable.app |
| 🧪 Preview (login required) | https://id-preview--82eaa6a9-82f4-4b41-9b64-4b59993322c1.lovable.app |

**Demo admin login:** request from the team (admin emails are whitelisted via `site_settings.admin_emails`).

---

## 🏃 Getting Started (Local Development)

### Prerequisites
- **Node.js 18+**
- **bun** (recommended) or **npm**
- A **Supabase** project (free tier works) — only needed for self-hosting; Lovable Cloud users skip this

### 1. Clone & install
```bash
git clone https://github.com/<your-org>/traveloop.git
cd traveloop
bun install        # or: npm install
```

### 2. Configure environment variables
Create a `.env` file in the project root:

```env
# Supabase / Lovable Cloud
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-publishable-key>
VITE_SUPABASE_PROJECT_ID=<your-project-ref>
```

> ℹ️ When using Lovable Cloud these are **auto-injected** — no manual setup required.

### 3. Set Edge Function secrets (server-side only)
In the Supabase dashboard → **Project Settings → Edge Functions → Secrets**, add:

| Secret | Where to get it |
|---|---|
| `LOVABLE_API_KEY` | https://lovable.dev → Workspace → API Keys (or use your own OpenAI/Gemini key + adapt the function) |
| `SUPABASE_URL` | Auto-set |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` |
| `SUPABASE_ANON_KEY` | Project Settings → API → `anon` |

### 4. Run database migrations
```bash
# Option A: Supabase CLI
supabase link --project-ref <your-project-ref>
supabase db push

# Option B: paste each file from supabase/migrations/ into the SQL editor in order
```

### 5. Deploy Edge Functions
```bash
supabase functions deploy generate-trip
supabase functions deploy trip-suggestions
```

### 6. Start the dev server
```bash
bun run dev        # or: npm run dev
```
App runs at **http://localhost:8080**.

### Useful scripts
| Command | What it does |
|---|---|
| `bun run dev` | Start Vite dev server with HMR |
| `bun run build` | Production build (code-split + chunked) |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | ESLint check |
| `bunx vitest run` | Run unit tests |

---

## 🚀 Deployment

You have **three** deployment paths — pick whichever fits your setup.

### Option A — Lovable (one-click, recommended)
1. Open the project in [Lovable](https://lovable.dev).
2. Top-right → **Publish**.
3. App goes live at `https://<your-slug>.lovable.app`.
4. (Optional) **Project Settings → Domains** to attach a custom domain.

> ⚡ Backend changes (Edge Functions, migrations) deploy **automatically**. Frontend changes require clicking **Update** in the publish dialog.

### Option B — Vercel + Supabase (self-hosted)
1. Push your repo to GitHub (Lovable auto-syncs via the GitHub integration).
2. Go to [vercel.com](https://vercel.com) → **Import Git Repository**.
3. **Framework preset:** Vite. **Build command:** `bun run build` (or `npm run build`). **Output dir:** `dist`.
4. Add the three `VITE_SUPABASE_*` env vars in Vercel → **Settings → Environment Variables**.
5. Deploy.
6. For backend:
   - Create a Supabase project at [supabase.com](https://supabase.com).
   - Run migrations from `supabase/migrations/` (CLI or SQL editor).
   - Deploy edge functions: `supabase functions deploy generate-trip` & `trip-suggestions`.
   - Add the secrets listed above in **Edge Functions → Secrets**.

### Option C — Netlify / Cloudflare Pages
Same as Vercel — they auto-detect Vite. Just set the same `VITE_SUPABASE_*` env vars and use `bun run build` → `dist`.

### Post-deployment checklist
- [ ] Auth → **URL Configuration** → add your prod URL to **Site URL** and **Redirect URLs**
- [ ] Google OAuth → add prod URL to authorized redirect URIs in Google Cloud Console
- [ ] Run a smoke test: signup → create trip → AI generate → share link
- [ ] Add admin emails to `site_settings.admin_emails` JSONB array

---



---

## ⚡ Performance Optimizations

- Route-level **code splitting** via `React.lazy` (initial bundle < 100 KB gz)
- **Manual vendor chunks**: react / query / supabase / icons
- TanStack Query: `staleTime 60s`, no refetch on focus
- All decorative images: `loading="lazy"`, `decoding="async"`, `fetchpriority="low"`
- CSS code-splitting + ES2020 target

---

## 🔒 Security

- Row-Level Security (RLS) on every user-owned table
- Roles stored in a **separate** `user_roles` table (not on profiles)
- `SECURITY DEFINER` functions for safe role checks
- Server-side admin verification — never client-side
- Email confirmation required for signup

---

## 🎨 Design System

- Dark/light themes via HSL semantic tokens defined in `src/index.css`
- Tailwind theme extended in `tailwind.config.ts`
- Custom variants: `premium`, `glass`, `aurora`, gradient-hero, shadow-glow
- Typography components in `src/components/ui/typography.tsx`

---

## 🖼️ Mockup

Excalidraw wireframes: https://link.excalidraw.com/l/65VNwvy7c4X/22o30WE3bE4

---

## 🏆 Built For

**Odoo Hackathon 2026** — Team Traveloop

Built with ❤️ using [Lovable](https://lovable.dev).

---

## 📜 License

MIT — feel free to fork and build on top of this.
