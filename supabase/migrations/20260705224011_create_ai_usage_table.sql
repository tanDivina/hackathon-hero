/*
# Create ai_usage table for Gemini rate limiting

1. New Tables
- `ai_usage`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users, not null)
  - `created_at` (timestamptz, default now)

2. Security
- Enable RLS
- Authenticated users can SELECT their own rows (for future usage dashboards)
- Inserts are performed by the service-role edge function only (no INSERT policy needed for client)

3. Performance
- Index on (user_id, created_at DESC) for fast per-user hourly count queries

4. Notes
- This table is the durable store for per-user AI request counts.
- Edge function instances are stateless; module-level counters would reset per instance.
  This table is the only correct way to enforce rate limits across instances.
*/

CREATE TABLE IF NOT EXISTS ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS ai_usage_user_created_idx ON ai_usage(user_id, created_at DESC);

DROP POLICY IF EXISTS "select_own_ai_usage" ON ai_usage;
CREATE POLICY "select_own_ai_usage" ON ai_usage FOR SELECT
TO authenticated USING (auth.uid() = user_id);
