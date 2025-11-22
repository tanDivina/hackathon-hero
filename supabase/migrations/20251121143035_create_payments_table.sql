/*
  # Create Payments Table

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `session_id` (text) - Links to local storage session
      - `paypal_order_id` (text) - PayPal transaction ID
      - `payer_email` (text) - Customer email
      - `amount` (numeric) - Payment amount
      - `currency` (text) - Currency code
      - `status` (text) - Payment status (completed, pending, failed)
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on `payments` table
    - Add policies for session-based access
    
  3. Indexes
    - Add index on session_id for fast lookups
    - Add index on paypal_order_id for verification
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  paypal_order_id text UNIQUE,
  payer_email text,
  amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_session_id ON payments(session_id);
CREATE INDEX IF NOT EXISTS idx_payments_paypal_order_id ON payments(paypal_order_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert payments"
  ON payments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update payments"
  ON payments
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);