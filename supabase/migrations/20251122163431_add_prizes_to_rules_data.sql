/*
  # Add Prizes Field to Rules Data

  1. Changes
    - Add `prizes` column to `rules_data` table to store prize information
    - Column stores array of prize information as JSONB

  2. Notes
    - Existing rows will have an empty array by default
    - This allows the rules chat to provide information about prizes
*/

-- Add prizes column to rules_data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rules_data' AND column_name = 'prizes'
  ) THEN
    ALTER TABLE rules_data ADD COLUMN prizes jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
