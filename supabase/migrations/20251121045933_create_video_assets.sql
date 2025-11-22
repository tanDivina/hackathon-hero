/*
  # Create Video Assets Schema

  1. New Tables
    - `video_assets`
      - `id` (uuid, primary key) - Unique identifier
      - `project_id` (uuid, foreign key) - Reference to projects table
      - `logo_url` (text) - URL or data URL for logo image
      - `audio_url` (text) - URL or data URL for background music
      - `logo_position` (text) - Position of logo (top-left, top-right, bottom-left, bottom-right, center)
      - `logo_size` (integer) - Size of logo in pixels (default 100)
      - `audio_volume` (real) - Volume level 0.0 to 1.0 (default 0.5)
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on video_assets table
    - Add policies for session-based access
    
  3. Indexes
    - Index on project_id for fast lookups
*/

-- Create video_assets table
CREATE TABLE IF NOT EXISTS video_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  logo_url text DEFAULT '',
  audio_url text DEFAULT '',
  logo_position text DEFAULT 'top-right',
  logo_size integer DEFAULT 100,
  audio_volume real DEFAULT 0.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_video_assets_project_id ON video_assets(project_id);

-- Enable RLS
ALTER TABLE video_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_assets table
CREATE POLICY "Users can view video assets"
  ON video_assets FOR SELECT
  USING (true);

CREATE POLICY "Users can insert video assets"
  ON video_assets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update video assets"
  ON video_assets FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete video assets"
  ON video_assets FOR DELETE
  USING (true);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_video_assets_updated_at BEFORE UPDATE ON video_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();