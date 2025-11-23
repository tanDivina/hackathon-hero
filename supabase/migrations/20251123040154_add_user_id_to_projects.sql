/*
  # Add user authentication support to projects

  1. Changes
    - Add `user_id` column to `projects` table
      - References `auth.users(id)`
      - Nullable to support existing session-based projects
      - Includes index for performance
    
  2. Security Updates
    - Drop existing overly-permissive RLS policies
    - Add new policies that check user ownership:
      - Authenticated users can only access their own projects (via user_id)
      - Anonymous users can access projects via session_id (for backward compatibility)
    
  3. Data Migration
    - Existing projects remain accessible via session_id
    - New projects created by authenticated users will use user_id
    
  Important Notes:
    - This migration preserves existing session-based projects
    - Once a user logs in, new projects will be tied to their user_id
    - Projects are owned by either session_id (anonymous) OR user_id (authenticated)
*/

-- Add user_id column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index on user_id for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Drop all existing overly-permissive policies on projects table
DROP POLICY IF EXISTS "Users can view own session projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own session projects" ON projects;
DROP POLICY IF EXISTS "Users can update own session projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own session projects" ON projects;

-- Create new secure policies for projects table

-- SELECT: Users can view their own projects (by user_id if authenticated, by session_id if not)
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: Users can create projects with their user_id
CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Update RLS policies for related tables to check project ownership

-- Drop existing overly-permissive policies on rules_data
DROP POLICY IF EXISTS "Users can view rules data" ON rules_data;
DROP POLICY IF EXISTS "Users can insert rules data" ON rules_data;
DROP POLICY IF EXISTS "Users can update rules data" ON rules_data;
DROP POLICY IF EXISTS "Users can delete rules data" ON rules_data;

-- New secure policies for rules_data
CREATE POLICY "Users can view own rules data"
  ON rules_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = rules_data.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own rules data"
  ON rules_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = rules_data.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own rules data"
  ON rules_data FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = rules_data.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = rules_data.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own rules data"
  ON rules_data FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = rules_data.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Drop existing overly-permissive policies on prompts
DROP POLICY IF EXISTS "Users can view prompts" ON prompts;
DROP POLICY IF EXISTS "Users can insert prompts" ON prompts;
DROP POLICY IF EXISTS "Users can update prompts" ON prompts;
DROP POLICY IF EXISTS "Users can delete prompts" ON prompts;

-- New secure policies for prompts
CREATE POLICY "Users can view own prompts"
  ON prompts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = prompts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own prompts"
  ON prompts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = prompts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own prompts"
  ON prompts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = prompts.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = prompts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own prompts"
  ON prompts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = prompts.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Drop existing overly-permissive policies on pitch_scripts
DROP POLICY IF EXISTS "Users can view pitch scripts" ON pitch_scripts;
DROP POLICY IF EXISTS "Users can insert pitch scripts" ON pitch_scripts;
DROP POLICY IF EXISTS "Users can update pitch scripts" ON pitch_scripts;
DROP POLICY IF EXISTS "Users can delete pitch scripts" ON pitch_scripts;

-- New secure policies for pitch_scripts
CREATE POLICY "Users can view own pitch scripts"
  ON pitch_scripts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pitch_scripts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own pitch scripts"
  ON pitch_scripts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pitch_scripts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own pitch scripts"
  ON pitch_scripts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pitch_scripts.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pitch_scripts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own pitch scripts"
  ON pitch_scripts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pitch_scripts.project_id
      AND projects.user_id = auth.uid()
    )
  );