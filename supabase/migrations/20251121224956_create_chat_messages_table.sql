/*
  # Create Chat Messages Table

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `role` (text, either 'user' or 'assistant')
      - `content` (text, message content)
      - `created_at` (timestamptz, timestamp)
      - `session_id` (text, user session identifier)

  2. Security
    - Enable RLS on `chat_messages` table
    - Add policy for users to read their own chat messages
    - Add policy for users to insert their own chat messages
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  session_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat messages"
  ON chat_messages
  FOR SELECT
  TO public
  USING (
    session_id IN (
      SELECT session_id FROM projects WHERE id = project_id
    )
  );

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages
  FOR INSERT
  TO public
  WITH CHECK (
    session_id IN (
      SELECT session_id FROM projects WHERE id = project_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
