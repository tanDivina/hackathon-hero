/*
  # Add Demo Video Script Support

  1. Changes to pitch_scripts table
    - Add `script_type` column to differentiate between pitch and demo scripts
    - Add `demo_requirements` column for hackathon requirements
    - Add `demo_tools` column for tools/technologies used
    - Add `demo_realworld_use` column for real-world user benefits
    - Add `github_url` column for PRO feature GitHub integration
    - Add `github_analyzed` column to track if GitHub was analyzed
    
  2. Notes
    - Backward compatible: existing scripts default to 'pitch' type
    - Demo fields are optional and only used when script_type = 'demo'
    - GitHub integration is a PRO feature
*/

-- Add new columns to pitch_scripts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_scripts' AND column_name = 'script_type'
  ) THEN
    ALTER TABLE pitch_scripts ADD COLUMN script_type text DEFAULT 'pitch';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_scripts' AND column_name = 'demo_requirements'
  ) THEN
    ALTER TABLE pitch_scripts ADD COLUMN demo_requirements text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_scripts' AND column_name = 'demo_tools'
  ) THEN
    ALTER TABLE pitch_scripts ADD COLUMN demo_tools text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_scripts' AND column_name = 'demo_realworld_use'
  ) THEN
    ALTER TABLE pitch_scripts ADD COLUMN demo_realworld_use text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_scripts' AND column_name = 'github_url'
  ) THEN
    ALTER TABLE pitch_scripts ADD COLUMN github_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_scripts' AND column_name = 'github_analyzed'
  ) THEN
    ALTER TABLE pitch_scripts ADD COLUMN github_analyzed boolean DEFAULT false;
  END IF;
END $$;