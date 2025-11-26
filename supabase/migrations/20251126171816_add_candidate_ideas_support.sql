/*
  # Add Candidate Ideas Support

  ## Changes
  
  1. Add columns to `ideas` table
    - `user_direction` (text) - User's hobbies, skills, or rough ideas for steering generation
    - `is_candidate` (boolean) - Whether this is a candidate idea (true) or final expanded idea (false)
    - `candidate_title` (text) - Catchy name for candidate ideas
    - `candidate_hook` (text) - 1-sentence description for candidates
    - `complexity` (text) - Estimated complexity: Low/Medium/High
    - `parent_candidate_id` (uuid) - Reference to the candidate that was expanded (for final ideas)
  
  ## Notes
  - Candidate ideas are shown as 3 options for user to choose from
  - When user selects a candidate, a full detailed idea is generated with parent_candidate_id set
  - User direction is optional and helps steer the AI generation
*/

-- Add new columns to ideas table
DO $$
BEGIN
  -- User direction for steering generation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideas' AND column_name = 'user_direction'
  ) THEN
    ALTER TABLE ideas ADD COLUMN user_direction text DEFAULT '';
  END IF;

  -- Flag to distinguish candidates from final ideas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideas' AND column_name = 'is_candidate'
  ) THEN
    ALTER TABLE ideas ADD COLUMN is_candidate boolean DEFAULT false;
  END IF;

  -- Candidate-specific fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideas' AND column_name = 'candidate_title'
  ) THEN
    ALTER TABLE ideas ADD COLUMN candidate_title text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideas' AND column_name = 'candidate_hook'
  ) THEN
    ALTER TABLE ideas ADD COLUMN candidate_hook text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideas' AND column_name = 'complexity'
  ) THEN
    ALTER TABLE ideas ADD COLUMN complexity text DEFAULT '';
  END IF;

  -- Reference to parent candidate (for expanded ideas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideas' AND column_name = 'parent_candidate_id'
  ) THEN
    ALTER TABLE ideas ADD COLUMN parent_candidate_id uuid REFERENCES ideas(id) ON DELETE SET NULL;
  END IF;
END $$;
