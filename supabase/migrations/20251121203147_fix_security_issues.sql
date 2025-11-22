/*
  # Fix Security and Performance Issues

  1. Changes
    - Add index on `ideas.project_id` for foreign key performance
    - Add index on `timelines.project_id` for foreign key performance
    - Drop unused index `idx_payments_paypal_order_id`
    - Fix function `update_updated_at_column` search path immutability
    
  2. Performance Improvements
    - Foreign key indexes improve JOIN and WHERE query performance
    - Removing unused indexes reduces write overhead
    
  3. Security Improvements
    - Immutable search path prevents privilege escalation attacks
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_ideas_project_id ON ideas(project_id);
CREATE INDEX IF NOT EXISTS idx_timelines_project_id ON timelines(project_id);

-- Drop unused index
DROP INDEX IF EXISTS idx_payments_paypal_order_id;

-- Recreate function with immutable search path
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers for all tables that use this function
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('hackathon_projects', 'rules_data', 'optimized_prompts', 'pitch_scripts', 'video_assets', 'ideas', 'timelines', 'payments')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', r.tablename, r.tablename);
    EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', r.tablename, r.tablename);
  END LOOP;
END;
$$;