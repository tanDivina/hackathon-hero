/*
  # Add Theme and Event Type to Rules Data

  1. Changes
    - Add `theme` column to `rules_data` table to store hackathon theme (e.g., "Halloween", "FinTech")
    - Add `event_type` column to `rules_data` table to classify event type
    - Valid event types: GAME_JAM, HACKATHON, DATATHON, DESIGN_CHALLENGE

  2. Notes
    - Existing rows will have default values: theme='General', event_type='HACKATHON'
    - This allows the idea generator to adapt prompts based on event type
    - Game jams will get creative/entertainment-focused ideas instead of utility apps
*/

-- Add theme column to rules_data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rules_data' AND column_name = 'theme'
  ) THEN
    ALTER TABLE rules_data ADD COLUMN theme text DEFAULT 'General';
  END IF;
END $$;

-- Add event_type column with enum constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rules_data' AND column_name = 'event_type'
  ) THEN
    ALTER TABLE rules_data ADD COLUMN event_type text DEFAULT 'HACKATHON';
    ALTER TABLE rules_data ADD CONSTRAINT event_type_check 
      CHECK (event_type IN ('GAME_JAM', 'HACKATHON', 'DATATHON', 'DESIGN_CHALLENGE'));
  END IF;
END $$;