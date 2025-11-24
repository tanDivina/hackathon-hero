/*
  # Add Insider Intel field to projects table

  1. Changes
    - Add `custom_instructions` column to `projects` table
      - Type: text (allows long-form notes from livestreams/Q&As)
      - Default: empty string
      - Purpose: Store insider intel from sponsor livestreams and Q&A sessions
  
  2. Notes
    - This field will be used by AI agents (Idea Generator and Script Generator)
    - High-priority instructions that override generic advice
    - Examples: sponsor preferences, judging criteria hints, technology preferences
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'custom_instructions'
  ) THEN
    ALTER TABLE projects ADD COLUMN custom_instructions text DEFAULT '';
  END IF;
END $$;