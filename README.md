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

## 🗃️ Database Schema (high level)

- `profiles` — user profile, language, plan (Free/Pro/Premium), notes
- `user_roles` — role-based access (`admin`, `user`) — separate table to prevent privilege escalation
- `trips` — cloud-synced trips (user_id, dates, full JSON payload)
- `has_role()` — `SECURITY DEFINER` function used inside RLS policies to avoid recursion

All sensitive tables protected with strict RLS policies.

---

## 🏃 Getting Started (local development)

### Prerequisites
- Node.js 18+ and `bun` or `npm`

### Install & run
```bash
git clone <your-repo-url>
cd traveloop
bun install        # or: npm install
bun run dev        # or: npm run dev
```

The app runs at `http://localhost:8080`.

### Environment
Lovable Cloud auto-provisions backend; the following are set in `.env` (managed automatically):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

For self-hosting, point these at your own Supabase project and run the migrations in `supabase/migrations/`.

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
