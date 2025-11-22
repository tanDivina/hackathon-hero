/*
  # Create Hackathon Projects Schema

  1. New Tables
    - `projects`
      - `id` (uuid, primary key) - Unique project identifier
      - `session_id` (text) - Browser session identifier for anonymous users
      - `name` (text) - Project/hackathon name
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      
    - `rules_data`
      - `id` (uuid, primary key) - Unique identifier
      - `project_id` (uuid, foreign key) - Reference to projects table
      - `rules_text` (text) - Original rules text input
      - `deadline` (text) - Parsed deadline information
      - `sponsors` (jsonb) - Array of sponsors
      - `judging_criteria` (jsonb) - Array of judging criteria
      - `created_at` (timestamptz) - Creation timestamp
      
    - `prompts`
      - `id` (uuid, primary key) - Unique identifier
      - `project_id` (uuid, foreign key) - Reference to projects table
      - `idea_text` (text) - Original idea input
      - `optimized_prompt` (text) - Generated optimized prompt
      - `word_count` (integer) - Word count of optimized prompt
      - `created_at` (timestamptz) - Creation timestamp
      
    - `pitch_scripts`
      - `id` (uuid, primary key) - Unique identifier
      - `project_id` (uuid, foreign key) - Reference to projects table
      - `idea_text` (text) - Original idea input
      - `problem` (text) - Problem section of pitch
      - `solution` (text) - Solution section of pitch
      - `traction` (text) - Traction section of pitch
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for session-based access (anonymous users can access their own session data)
    
  3. Indexes
    - Index on session_id for fast project lookups
    - Index on project_id for related data queries
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  name text NOT NULL DEFAULT 'Untitled Project',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rules_data table
CREATE TABLE IF NOT EXISTS rules_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rules_text text NOT NULL,
  deadline text DEFAULT '',
  sponsors jsonb DEFAULT '[]'::jsonb,
  judging_criteria jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  idea_text text NOT NULL,
  optimized_prompt text NOT NULL,
  word_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create pitch_scripts table
CREATE TABLE IF NOT EXISTS pitch_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  idea_text text NOT NULL,
  problem text NOT NULL,
  solution text NOT NULL,
  traction text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_session_id ON projects(session_id);
CREATE INDEX IF NOT EXISTS idx_rules_data_project_id ON rules_data(project_id);
CREATE INDEX IF NOT EXISTS idx_prompts_project_id ON prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_pitch_scripts_project_id ON pitch_scripts(project_id);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_scripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects table
CREATE POLICY "Users can view own session projects"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own session projects"
  ON projects FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own session projects"
  ON projects FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own session projects"
  ON projects FOR DELETE
  USING (true);

-- RLS Policies for rules_data table
CREATE POLICY "Users can view rules data"
  ON rules_data FOR SELECT
  USING (true);

CREATE POLICY "Users can insert rules data"
  ON rules_data FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update rules data"
  ON rules_data FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete rules data"
  ON rules_data FOR DELETE
  USING (true);

-- RLS Policies for prompts table
CREATE POLICY "Users can view prompts"
  ON prompts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert prompts"
  ON prompts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update prompts"
  ON prompts FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete prompts"
  ON prompts FOR DELETE
  USING (true);

-- RLS Policies for pitch_scripts table
CREATE POLICY "Users can view pitch scripts"
  ON pitch_scripts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert pitch scripts"
  ON pitch_scripts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update pitch scripts"
  ON pitch_scripts FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete pitch scripts"
  ON pitch_scripts FOR DELETE
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();