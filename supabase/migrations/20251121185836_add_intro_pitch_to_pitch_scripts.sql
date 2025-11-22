/*
  # Add Intro Pitch Fields to Pitch Scripts Table

  1. Changes
    - Add `intro_who` (text) - "Who you are" section
    - Add `intro_what` (text) - "What you're building" section
    - Add `intro_why` (text) - "Why you're building it" section
    - Add `intro_full_script` (text) - Complete 20-second intro pitch
    - Add `your_name` (text) - User's name for personalization
    
  2. Notes
    - These fields are optional and separate from the 3-minute pitch
    - Allows users to have both intro pitch and full pitch scripts
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_scripts' AND column_name = 'intro_who'
  ) THEN
    ALTER TABLE pitch_scripts ADD COLUMN intro_who text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_scripts' AND column_name = 'intro_what'
  ) THEN
    ALTER TABLE pitch_scripts ADD COLUMN intro_what text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_scripts' AND column_name = 'intro_why'
  ) THEN
    ALTER TABLE pitch_scripts ADD COLUMN intro_why text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_scripts' AND column_name = 'intro_full_script'
  ) THEN
    ALTER TABLE pitch_scripts ADD COLUMN intro_full_script text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_scripts' AND column_name = 'your_name'
  ) THEN
    ALTER TABLE pitch_scripts ADD COLUMN your_name text;
  END IF;
END $$;