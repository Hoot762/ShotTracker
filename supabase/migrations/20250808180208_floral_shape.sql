/*
  # Initial Schema Setup for ShotTracker Pro

  1. New Tables
    - `users` - User accounts with authentication
    - `sessions` - Shooting session records
    - `dope_cards` - DOPE card management
    - `dope_ranges` - Range data for DOPE cards

  2. Security
    - Enable RLS on all tables
    - Add policies for user data isolation
    - Admin access policies

  3. Functions
    - Auto-create user profile on signup
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  rifle TEXT NOT NULL,
  calibre TEXT NOT NULL,
  bullet_weight INTEGER NOT NULL,
  distance INTEGER NOT NULL,
  elevation REAL,
  windage REAL,
  shots TEXT[] NOT NULL,
  total_score REAL NOT NULL,
  v_count INTEGER NOT NULL,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOPE Cards table
CREATE TABLE IF NOT EXISTS dope_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rifle TEXT NOT NULL,
  calibre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOPE Ranges table
CREATE TABLE IF NOT EXISTS dope_ranges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dope_card_id UUID NOT NULL REFERENCES dope_cards(id) ON DELETE CASCADE,
  range INTEGER NOT NULL,
  elevation REAL,
  windage REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dope_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dope_ranges ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND is_admin = true
    )
  );

CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND is_admin = true
    )
  );

CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND is_admin = true
    )
  );

-- Sessions policies
CREATE POLICY "Users can read own sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own sessions"
  ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own sessions"
  ON sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own sessions"
  ON sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- DOPE Cards policies
CREATE POLICY "Users can read own dope cards"
  ON dope_cards
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own dope cards"
  ON dope_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own dope cards"
  ON dope_cards
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own dope cards"
  ON dope_cards
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- DOPE Ranges policies
CREATE POLICY "Users can read dope ranges for own cards"
  ON dope_ranges
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dope_cards 
      WHERE id = dope_card_id AND user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert dope ranges for own cards"
  ON dope_ranges
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dope_cards 
      WHERE id = dope_card_id AND user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update dope ranges for own cards"
  ON dope_ranges
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dope_cards 
      WHERE id = dope_card_id AND user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete dope ranges for own cards"
  ON dope_ranges
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dope_cards 
      WHERE id = dope_card_id AND user_id::text = auth.uid()::text
    )
  );

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, is_admin)
  VALUES (NEW.id, NEW.email, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create super admin user (update email/password as needed)
INSERT INTO users (id, email, is_admin) 
VALUES (
  uuid_generate_v4(),
  'superadmin@shottracker.com',
  true
) ON CONFLICT (email) DO UPDATE SET is_admin = true;