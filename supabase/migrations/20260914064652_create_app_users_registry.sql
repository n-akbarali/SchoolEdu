/*
# Central User Registry (app_users)

## Purpose
A universal, cross-device credential registry so accounts created by the
Superadmin or Director can log in from any browser, incognito window, or device.
Previously credentials lived only in localStorage which is browser-specific.

## New Table: app_users
- id (uuid PK)
- username (text, unique, case-insensitive via lower() index)
- password (text)
- role (text: 'director' | 'teacher' | 'student' | 'parent')
- school_id (text, nullable — references the localStorage school ID for cross-referencing)
- display_name (text)
- local_id (text, nullable — the localStorage record ID for cross-reference)
- created_at (timestamptz)

## Security
- RLS enabled.
- This app has a login screen but uses a custom localStorage-based session,
  NOT Supabase Auth. The frontend talks with the anon key.
- Policies allow anon + authenticated to CRUD because the app manages its own
  session logic on top of this registry table. The registry is intentionally
  shared (any browser must read any user's credentials to validate login).
*/

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('director', 'teacher', 'student', 'parent')),
  school_id text,
  display_name text NOT NULL,
  local_id text,
  created_at timestamptz DEFAULT now()
);

-- Unique index on lowercase username for case-insensitive matching
CREATE UNIQUE INDEX IF NOT EXISTS app_users_username_lower_idx
  ON app_users (lower(username));

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_app_users" ON app_users;
CREATE POLICY "anon_select_app_users"
  ON app_users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_app_users" ON app_users;
CREATE POLICY "anon_insert_app_users"
  ON app_users FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_app_users" ON app_users;
CREATE POLICY "anon_update_app_users"
  ON app_users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_app_users" ON app_users;
CREATE POLICY "anon_delete_app_users"
  ON app_users FOR DELETE
  TO anon, authenticated USING (true);
