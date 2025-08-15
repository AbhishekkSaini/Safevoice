/*
  # Create emergency alerts system

  1. New Tables
    - `emergency_alerts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `alert_type` (text)
      - `message` (text)
      - `location_lat` (decimal)
      - `location_lng` (decimal)
      - `address` (text)
      - `status` (text)
      - `resolved_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `emergency_alerts` table
    - Add policies for emergency alerts visibility
*/

CREATE TABLE IF NOT EXISTS emergency_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('medical', 'fire', 'police', 'natural_disaster', 'other')),
  message text DEFAULT '',
  location_lat decimal,
  location_lng decimal,
  address text DEFAULT '',
  status text DEFAULT 'active' CHECK (status IN ('active', 'responding', 'resolved')),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for emergency alerts
CREATE POLICY "Users can view own emergency alerts"
  ON emergency_alerts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emergency alerts"
  ON emergency_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emergency alerts"
  ON emergency_alerts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Public policy for emergency responders (you might want to restrict this further)
CREATE POLICY "Emergency responders can view active alerts"
  ON emergency_alerts
  FOR SELECT
  TO authenticated
  USING (status = 'active');