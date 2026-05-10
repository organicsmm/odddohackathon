-- ============================================================================
-- Traveloop — Consolidated Database Schema (reference snapshot)
-- ----------------------------------------------------------------------------
-- This file is a human-readable, single-file snapshot of the production
-- Postgres schema. The authoritative source of truth is the timestamped
-- migrations in `supabase/migrations/` — those are what gets applied.
--
-- This file exists so reviewers (and code-analysis bots) can read the entire
-- backend in one glance: tables, enums, RLS policies, functions, triggers.
--
-- Apply order (already done via migrations):
--   1. Enums + tables
--   2. RLS policies
--   3. SECURITY DEFINER functions
--   4. Triggers
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- ---------------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------------

-- 2.1 profiles -------------------------------------------------------------
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE,           -- references auth.users.id
  email           TEXT NOT NULL,
  display_name    TEXT,
  avatar_url      TEXT,
  plan            TEXT NOT NULL DEFAULT 'free',   -- free | pro | premium
  plan_expires_at TIMESTAMPTZ,
  banned          BOOLEAN NOT NULL DEFAULT false,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2.2 user_roles -----------------------------------------------------------
-- IMPORTANT: roles live in their own table (NOT on profiles) to prevent
-- privilege-escalation attacks via client-side updates.
CREATE TABLE public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  role       public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2.3 trips ----------------------------------------------------------------
CREATE TABLE public.trips (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  client_trip_id TEXT NOT NULL,                   -- local-store id for upsert
  name           TEXT NOT NULL,
  start_date     DATE,
  end_date       DATE,
  data           JSONB NOT NULL,                  -- full trip payload
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_trip_id)
);
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_trips_user_id ON public.trips (user_id);
CREATE INDEX idx_trips_updated ON public.trips (updated_at DESC);

-- 2.4 site_settings --------------------------------------------------------
CREATE TABLE public.site_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. SECURITY DEFINER FUNCTIONS
-- ---------------------------------------------------------------------------

-- 3.1 has_role -------------------------------------------------------------
-- Used in RLS policies. SECURITY DEFINER + STABLE so it bypasses RLS on
-- user_roles and avoids recursive policy evaluation.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3.2 handle_new_user ------------------------------------------------------
-- Trigger on auth.users insert: creates profile, default 'user' role,
-- auto-promotes to 'admin' if email is whitelisted in site_settings.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_emails JSONB;
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name',
             NEW.raw_user_meta_data->>'name',
             split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT DO NOTHING;

  SELECT value INTO admin_emails FROM public.site_settings WHERE key = 'admin_emails';
  IF admin_emails ? NEW.email THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 3.3 tg_set_updated_at ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. TRIGGERS
-- ---------------------------------------------------------------------------
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER set_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. ROW-LEVEL SECURITY POLICIES
-- ---------------------------------------------------------------------------

-- 5.1 profiles -------------------------------------------------------------
CREATE POLICY "Authenticated read profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5.2 user_roles -----------------------------------------------------------
CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5.3 trips ----------------------------------------------------------------
CREATE POLICY "Users view own trips"
  ON public.trips FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own trips"
  ON public.trips FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own trips"
  ON public.trips FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own trips"
  ON public.trips FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all trips"
  ON public.trips FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update any trip"
  ON public.trips FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete any trip"
  ON public.trips FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5.4 site_settings --------------------------------------------------------
CREATE POLICY "Anyone read settings"
  ON public.site_settings FOR SELECT TO public USING (true);

CREATE POLICY "Admins manage settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 6. SEED DATA (optional, safe to re-run)
-- ---------------------------------------------------------------------------
INSERT INTO public.site_settings (key, value)
VALUES ('admin_emails', '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- End of schema.
