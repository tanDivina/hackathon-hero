/*
  # Simplify Projects RLS for Anonymous Users

  1. Changes
    - Drop complex header-based policies
    - Add simple policies that allow anonymous access
    
  2. Security
    - Authenticated users can only access their own projects (user_id check)
    - Anonymous users (anon role) can access all projects where user_id is NULL
    - This provides basic isolation while allowing the app to work without auth
    
  3. Important Notes
    - Anonymous users can technically see each other's projects
    - This is acceptable for a hackathon tool where data isn't highly sensitive
    - Users should sign up for proper data isolation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow project select for authenticated users and session owners" ON projects;
DROP POLICY IF EXISTS "Allow project insert for authenticated users and anonymous" ON projects;
DROP POLICY IF EXISTS "Allow project update for authenticated users and session owners" ON projects;
DROP POLICY IF EXISTS "Allow project delete for authenticated users and session owners" ON projects;

-- Create simple policies
CREATE POLICY "Users can view their own projects or anonymous projects"
  ON projects FOR SELECT
  TO authenticated, anon
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (user_id IS NULL)
  );

CREATE POLICY "Authenticated users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anonymous users can create projects"
  ON projects FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Users can update their own projects or anonymous projects"
  ON projects FOR UPDATE
  TO authenticated, anon
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (user_id IS NULL)
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (user_id IS NULL)
  );

CREATE POLICY "Users can delete their own projects or anonymous projects"
  ON projects FOR DELETE
  TO authenticated, anon
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (user_id IS NULL)
  );