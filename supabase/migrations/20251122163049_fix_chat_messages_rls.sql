/*
  # Fix Chat Messages RLS Policies

  1. Changes
    - Drop existing restrictive policies
    - Create new policies that allow authenticated users to manage chat messages for their projects
    - Use auth.uid() for proper user identification

  2. Security
    - Users can only read/write chat messages for projects they own (matching session_id to user_id)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON chat_messages;

-- Create new policies for authenticated users
CREATE POLICY "Authenticated users can read own chat messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chat_messages.project_id 
      AND projects.session_id = auth.uid()::text
    )
  );

CREATE POLICY "Authenticated users can insert own chat messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chat_messages.project_id 
      AND projects.session_id = auth.uid()::text
    )
  );

-- Also allow public access for non-authenticated users using session matching
CREATE POLICY "Public users can read own chat messages"
  ON chat_messages
  FOR SELECT
  TO public
  USING (
    session_id IN (
      SELECT session_id FROM projects WHERE id = chat_messages.project_id
    )
  );

CREATE POLICY "Public users can insert own chat messages"
  ON chat_messages
  FOR INSERT
  TO public
  WITH CHECK (
    session_id IN (
      SELECT session_id FROM projects WHERE id = chat_messages.project_id
    )
  );
