/*
  # Fix Projects RLS for Authenticated Users

  1. Changes
    - Update INSERT policy for authenticated users to allow creating projects with their user_id
    - Simplify the check to be more permissive while still maintaining security

  2. Security  
    - Authenticated users can create projects where user_id matches their auth ID
    - Authenticated users can also create anonymous projects (user_id IS NULL) if needed
    - Anonymous users (anon role) can only create projects where user_id is NULL

  3. Important Notes
    - This fixes the "new row violates row-level security policy" error
    - Maintains proper isolation between users
    - Allows authenticated users full control over their project creation
*/

-- Drop existing insert policies
DROP POLICY IF EXISTS "Authenticated users can create own projects" ON projects;
DROP POLICY IF EXISTS "Anonymous users can create projects" ON projects;

-- Create improved policies
CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR user_id IS NULL
  );

CREATE POLICY "Anonymous users can create projects"
  ON projects FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);