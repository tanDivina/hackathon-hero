/*
  # Add updated_at to ideas table

  1. Changes
    - Add `updated_at` column to ideas table with default value of now()
    - Add trigger to automatically update `updated_at` on row updates

  2. Notes
    - This enables proper tracking of when ideas are modified
    - The trigger ensures updated_at is always current
*/

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideas' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE ideas ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_ideas_updated_at ON ideas;

CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
