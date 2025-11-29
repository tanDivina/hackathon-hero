/*
  # Add updated_at column to pitch_scripts table

  1. Changes
    - Add `updated_at` column to `pitch_scripts` table with default value of `now()`
    - This column is used by the existing trigger `update_pitch_scripts_updated_at`
  
  2. Notes
    - The trigger already exists and tries to update this column, but the column was missing
    - This fixes the 400 error: "record 'new' has no field 'updated_at'"
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_scripts' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE pitch_scripts ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;
