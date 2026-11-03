-- ==============================================================================
-- Supabase Schema Migration: Events, Contact Submissions, Admin Authorization & Storage
-- YEP Initiative (Yael Educational Pathway)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Admin Users Table
-- Only users listed in this table with an active Supabase Auth user record
-- are granted administrative privileges.
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper function to check if the current request user is an authorized admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  );
$$;

-- 3. Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  short_description TEXT,
  full_description TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  venue TEXT NOT NULL,
  cover_image TEXT,
  registration_link TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_events_updated_at ON public.events;
CREATE TRIGGER trigger_set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_published_start_date ON public.events (is_published, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events (start_date);

-- 4. Contact Submissions Table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for contact submissions
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_is_read ON public.contact_submissions (is_read);

-- ==============================================================================
-- 5. Row Level Security (RLS) Configuration
-- ==============================================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- --- Admin Users Policies ---
DROP POLICY IF EXISTS "Users can view their own admin status" ON public.admin_users;
CREATE POLICY "Users can view their own admin status"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can view admin list" ON public.admin_users;
CREATE POLICY "Admins can view admin list"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- --- Events Policies ---
DROP POLICY IF EXISTS "Public can view published events" ON public.events;
CREATE POLICY "Public can view published events"
  ON public.events
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
CREATE POLICY "Admins can view all events"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can create events" ON public.events;
CREATE POLICY "Admins can create events"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Admins can update events"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins can delete events"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- --- Contact Submissions Policies ---
DROP POLICY IF EXISTS "Public can submit contact messages" ON public.contact_submissions;
CREATE POLICY "Public can submit contact messages"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(trim(name)) > 0 AND char_length(name) <= 100 AND
    char_length(trim(subject)) > 0 AND char_length(subject) <= 150 AND
    char_length(trim(message)) > 0 AND char_length(message) <= 2000
  );

DROP POLICY IF EXISTS "Admins can view contact submissions" ON public.contact_submissions;
CREATE POLICY "Admins can view contact submissions"
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update contact submissions" ON public.contact_submissions;
CREATE POLICY "Admins can update contact submissions"
  ON public.contact_submissions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete contact submissions" ON public.contact_submissions;
CREATE POLICY "Admins can delete contact submissions"
  ON public.contact_submissions
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- 6. Storage Bucket for Event Cover Images
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-covers',
  'event-covers',
  true,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage Policies
DROP POLICY IF EXISTS "Public can view event cover images" ON storage.objects;
CREATE POLICY "Public can view event cover images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'event-covers');

DROP POLICY IF EXISTS "Admins can upload event cover images" ON storage.objects;
CREATE POLICY "Admins can upload event cover images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'event-covers' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update event cover images" ON storage.objects;
CREATE POLICY "Admins can update event cover images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'event-covers' AND public.is_admin())
  WITH CHECK (bucket_id = 'event-covers' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete event cover images" ON storage.objects;
CREATE POLICY "Admins can delete event cover images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'event-covers' AND public.is_admin());

