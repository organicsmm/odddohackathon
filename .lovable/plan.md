## Goal
Real authentication add karna (Lovable Cloud + Google login + Email/password) aur admin panel banana jisme aapka Gmail login karte hi poora admin dashboard mile. Normal users ko app waise hi chalti rahe.

## Backend (Lovable Cloud)

**New tables:**
- `profiles` — user info (display_name, email, avatar, banned flag)
- `user_roles` — role assignment (`admin` | `user`) — separate table for security
- `trips` — trips DB (migrate from localStorage going forward; existing localStorage trips remain local)
- `site_settings` — admin-editable landing page text, featured destinations toggle (key/value JSON)

**Security:**
- RLS on all tables
- `has_role(user_id, role)` security-definer function
- Users can only CRUD own trips/profile
- Admins can read/edit/delete ALL trips, users, settings
- Auto-create profile on signup via trigger
- Admin email seeded as admin role on first login

**Auth:**
- Enable Google OAuth (managed) + Email/password
- Password HIBP check on

## Frontend

**Auth refactor:**
- Replace localStorage `AuthContext` with Supabase auth
- `useAuth()` exposes `user`, `session`, `isAdmin`
- Existing `/login`, `/signup` pages updated to use Supabase + Google button
- Trips storage: switch `useTrips` hook to Supabase (with localStorage fallback for unauthenticated)

**Admin Panel — `/admin`** (protected route, admin only):
```
/admin
├── Overview     — stats cards (users, trips, popular destinations) + charts
├── Users        — list, search, ban/unban, delete
├── Trips        — list all, view/edit/delete any trip
└── Settings     — edit landing hero text, toggle marquee, featured destinations
```

**Components:**
- `AdminLayout` with sidebar (Overview / Users / Trips / Settings)
- `AdminGuard` route wrapper — redirects non-admins
- Stats use Recharts (already installed)
- Landing page reads from `site_settings` so admin edits show live

**Navbar:**
- Show "Admin" link only when `isAdmin === true`

## Implementation Steps
1. Run migration: tables + RLS + roles + trigger + seed admin
2. Enable Google OAuth via configure_social_auth
3. Refactor `AuthContext` + `Auth` page (Supabase + Google button)
4. Add `useUserRole` hook
5. Build `/admin` routes + 4 sub-pages
6. Add `AdminGuard`
7. Wire site_settings into Landing page
8. Add "Admin" link in navbar (conditional)

## Notes
- Existing localStorage trips stay local — only new trips after login go to DB. Migration of old trips can be added later if needed.
- Aapka Gmail confirm hote hi seed query run karunga.
