/*
  # Fix Security Issues

  1. Performance Improvements
    - Add index on newsletter_subscriptions.user_id foreign key
      - This improves query performance when filtering by user_id
      - Prevents suboptimal performance on foreign key lookups

  2. Security Improvements
    - Fix search_path for update_updated_at_column function
      - Set search_path to empty string to prevent search_path injection attacks
      - Makes function security definer safe
*/

-- Add index on newsletter_subscriptions.user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'newsletter_subscriptions'
    AND indexname = 'idx_newsletter_subscriptions_user_id'
  ) THEN
    CREATE INDEX idx_newsletter_subscriptions_user_id 
      ON newsletter_subscriptions(user_id);
  END IF;
END $$;

-- Recreate update_updated_at_column function with secure search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
