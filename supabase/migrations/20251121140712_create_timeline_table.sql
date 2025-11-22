/*
  # Create Timeline Table

  1. New Tables
    - `timelines`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `milestones` (jsonb) - Array of milestone objects with completion status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on `timelines` table
    - Add policies for all users to manage timelines (session-based)
    
  3. Relationships
    - Foreign key to projects table
*/

CREATE TABLE IF NOT EXISTS timelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  milestones jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all timelines"
  ON timelines
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert timelines"
  ON timelines
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update timelines"
  ON timelines
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete timelines"
  ON timelines
  FOR DELETE
  TO anon, authenticated
  USING (true);