/*
  # Create Ideas Table

  1. New Tables
    - `ideas`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `idea_text` (text) - The generated idea
      - `category` (text) - Category of the idea (e.g., AI, Tool, Data, Web)
      - `reasoning` (text) - Why this idea aligns with the hackathon
      - `sponsor_alignment` (text) - How it aligns with sponsors
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on `ideas` table
    - Add policies for all users to manage ideas (session-based)
    
  3. Relationships
    - Foreign key to projects table
*/

CREATE TABLE IF NOT EXISTS ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  idea_text text NOT NULL DEFAULT '',
  category text DEFAULT '',
  reasoning text DEFAULT '',
  sponsor_alignment text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all ideas"
  ON ideas
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert ideas"
  ON ideas
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update ideas"
  ON ideas
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete ideas"
  ON ideas
  FOR DELETE
  TO anon, authenticated
  USING (true);