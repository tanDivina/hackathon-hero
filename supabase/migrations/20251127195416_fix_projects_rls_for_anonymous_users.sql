/*
  # Fix Projects RLS for Anonymous Users

  1. Changes
    - Drop existing restrictive RLS policies that only allow authenticated users
    - Add new policies that support both authenticated users and anonymous session-based access
    
  2. Security
    - Authenticated users can only access their own projects (user_id check)
    - Anonymous users can only access projects with their session_id
    - Session IDs are stored in browser localStorage and provide basic isolation
    
  3. Important Notes
    - This allows the app to work without authentication
    - Session-based access is less secure than user authentication
    - Users should be encouraged to sign up for better data persistence
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Create new policies that support both authenticated and anonymous users
CREATE POLICY "Allow project select for authenticated users and session owners"
  ON projects FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
  );

CREATE POLICY "Allow project insert for authenticated users and anonymous"
  ON projects FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND user_id IS NULL)
  );

CREATE POLICY "Allow project update for authenticated users and session owners"
  ON projects FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
  );

CREATE POLICY "Allow project delete for authenticated users and session owners"
  ON projects FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
  );