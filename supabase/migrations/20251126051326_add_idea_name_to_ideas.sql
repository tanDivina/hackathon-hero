/*
  # Add idea_name to ideas table

  ## Changes
  - Add `idea_name` column to `ideas` table
    - Type: text
    - Default: empty string
    - Stores the short name/title of the idea (e.g., "FounderFlow", "CodeMentor")
  
  ## Notes
  - This field will be used to pre-populate the project name in the Video Creator branding field
  - Allows users to give their generated ideas memorable names
*/

-- Add idea_name column to ideas table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideas' AND column_name = 'idea_name'
  ) THEN
    ALTER TABLE ideas ADD COLUMN idea_name text DEFAULT '';
  END IF;
END $$;
