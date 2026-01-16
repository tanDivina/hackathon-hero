/*
  # Fix Remaining Security Issues

  1. Performance Improvements
    - Add index for foreign key on newsletter_subscriptions.user_id
    - Remove unused index on ideas.parent_candidate_id

  2. Security Fixes
    - Remove duplicate permissive policies on ideas table (keep secure one)
    - Remove duplicate permissive policies on timelines table (keep secure one)
    - Add email validation to newsletter subscriptions policy

  3. Tables affected:
    - newsletter_subscriptions: Add index, improve RLS policy
    - ideas: Remove old overly permissive policy
    - timelines: Remove old overly permissive policy

  Note: Auth DB connection strategy requires manual configuration in Supabase Dashboard
  Go to Settings > Database > Connection Pooling and change to percentage-based allocation
*/

-- ============================================================================
-- PERFORMANCE: Add index for foreign key on newsletter_subscriptions.user_id
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_user_id ON newsletter_subscriptions(user_id);

-- ============================================================================
-- PERFORMANCE: Remove unused index on ideas.parent_candidate_id
-- ============================================================================

DROP INDEX IF EXISTS idx_ideas_parent_candidate_id;

-- ============================================================================
-- SECURITY: Remove duplicate permissive policies on ideas table
-- Keep the secure policy that checks project ownership
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all ideas" ON ideas;

-- ============================================================================
-- SECURITY: Remove duplicate permissive policies on timelines table
-- Keep the secure policy that checks project ownership
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all timelines" ON timelines;

-- ============================================================================
-- SECURITY: Improve newsletter subscriptions policy with email validation
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscriptions;

-- Add policy with basic email validation to prevent abuse
CREATE POLICY "Anyone can subscribe to newsletter with valid email"
  ON newsletter_subscriptions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL 
    AND email != '' 
    AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );