/*
  # Create newsletter subscriptions table

  1. New Tables
    - `newsletter_subscriptions`
      - `id` (uuid, primary key)
      - `email` (text, unique, not null)
      - `subscribed_at` (timestamptz, default now())
      - `is_active` (boolean, default true)
      - `user_id` (uuid, nullable, foreign key to auth.users)

  2. Security
    - Enable RLS on `newsletter_subscriptions` table
    - Add policy for anyone to insert their email (public subscription)
    - Add policy for users to view their own subscriptions
    - Add policy for authenticated users to unsubscribe

  3. Notes
    - Email addresses are unique to prevent duplicate subscriptions
    - User ID is optional to support non-authenticated subscriptions
    - Active status allows soft deletion of subscriptions
*/

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  subscribed_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscriptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own subscriptions"
  ON newsletter_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can unsubscribe"
  ON newsletter_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_user_id ON newsletter_subscriptions(user_id);
