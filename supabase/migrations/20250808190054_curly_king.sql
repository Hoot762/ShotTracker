/*
  # Create Initial Admin User

  1. Database Setup
    - Creates users table if not exists
    - Sets up Row Level Security (RLS)
    - Creates admin policies

  2. Initial Admin User
    - Email: admin@shottracker.com
    - Password: admin123
    - Role: Administrator

  3. Security
    - Enable RLS on users table
    - Add policies for user management
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  date text NOT NULL,
  rifle text NOT NULL,
  calibre text NOT NULL,
  bullet_weight integer NOT NULL,
  distance integer NOT NULL,
  elevation real,
  windage real,
  shots text[] NOT NULL,
  total_score real NOT NULL,
  v_count integer NOT NULL,
  photo_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users can read own sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create DOPE cards table if it doesn't exist
CREATE TABLE IF NOT EXISTS dope_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  rifle text NOT NULL,
  calibre text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on dope_cards
ALTER TABLE dope_cards ENABLE ROW LEVEL SECURITY;

-- DOPE cards policies
CREATE POLICY "Users can read own dope cards"
  ON dope_cards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dope cards"
  ON dope_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dope cards"
  ON dope_cards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dope cards"
  ON dope_cards
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create DOPE ranges table if it doesn't exist
CREATE TABLE IF NOT EXISTS dope_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dope_card_id uuid NOT NULL REFERENCES dope_cards(id) ON DELETE CASCADE,
  range integer NOT NULL,
  elevation real,
  windage real,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on dope_ranges
ALTER TABLE dope_ranges ENABLE ROW LEVEL SECURITY;

-- DOPE ranges policies
CREATE POLICY "Users can read dope ranges for own cards"
  ON dope_ranges
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dope_cards
      WHERE dope_cards.id = dope_ranges.dope_card_id
      AND dope_cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert dope ranges for own cards"
  ON dope_ranges
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dope_cards
      WHERE dope_cards.id = dope_ranges.dope_card_id
      AND dope_cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update dope ranges for own cards"
  ON dope_ranges
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dope_cards
      WHERE dope_cards.id = dope_ranges.dope_card_id
      AND dope_cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete dope ranges for own cards"
  ON dope_ranges
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dope_cards
      WHERE dope_cards.id = dope_ranges.dope_card_id
      AND dope_cards.user_id = auth.uid()
    )
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (id, email, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'admin@shottracker.com' THEN true
      ELSE false
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();