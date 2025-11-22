/*
  # Fix RLS Performance and Security Issues

  1. Performance Fixes
    - Update all RLS policies to use `(select auth.uid())` instead of `auth.uid()` directly
    - This prevents re-evaluation for each row and improves query performance at scale
    
  2. Policy Consolidation
    - Remove duplicate permissive policies on `chat_messages` table
    - Combine authenticated and public policies into single policies
    
  3. Index Cleanup
    - Drop unused indexes that are not being utilized
    
  Tables affected:
    - stripe_customers
    - stripe_subscriptions
    - stripe_orders
    - newsletter_subscriptions
    - chat_messages
*/

-- Drop existing policies that need to be recreated
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Users can view their own order data" ON stripe_orders;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Users can unsubscribe" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can read own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can insert own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Public users can read own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Public users can insert own chat messages" ON chat_messages;

-- Recreate stripe_customers policy with optimized auth.uid()
CREATE POLICY "Users can view their own customer data"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) AND deleted_at IS NULL);

-- Recreate stripe_subscriptions policy with optimized auth.uid()
CREATE POLICY "Users can view their own subscription data"
  ON stripe_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id 
      FROM stripe_customers 
      WHERE user_id = (select auth.uid()) AND deleted_at IS NULL
    ) 
    AND deleted_at IS NULL
  );

-- Recreate stripe_orders policy with optimized auth.uid()
CREATE POLICY "Users can view their own order data"
  ON stripe_orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id 
      FROM stripe_customers 
      WHERE user_id = (select auth.uid()) AND deleted_at IS NULL
    ) 
    AND deleted_at IS NULL
  );

-- Recreate newsletter_subscriptions policies with optimized auth.uid()
CREATE POLICY "Users can view own subscriptions"
  ON newsletter_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can unsubscribe"
  ON newsletter_subscriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Recreate chat_messages policies - consolidated to avoid multiple permissive policies
CREATE POLICY "Users can read own chat messages"
  ON chat_messages
  FOR SELECT
  TO authenticated, anon
  USING (
    -- Allow if user owns the project (authenticated)
    EXISTS (
      SELECT 1 
      FROM projects 
      WHERE projects.id = chat_messages.project_id 
        AND projects.session_id = (select auth.uid())::text
    )
    OR
    -- Allow if session matches (anon users)
    session_id IN (
      SELECT projects.session_id 
      FROM projects 
      WHERE projects.id = chat_messages.project_id
    )
  );

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Allow if user owns the project (authenticated)
    EXISTS (
      SELECT 1 
      FROM projects 
      WHERE projects.id = chat_messages.project_id 
        AND projects.session_id = (select auth.uid())::text
    )
    OR
    -- Allow if session matches (anon users)
    session_id IN (
      SELECT projects.session_id 
      FROM projects 
      WHERE projects.id = chat_messages.project_id
    )
  );

-- Drop unused indexes
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_newsletter_email;
DROP INDEX IF EXISTS idx_newsletter_user_id;
