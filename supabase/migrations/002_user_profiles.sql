-- User Profiles table for Profile QR codes
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  job_title TEXT,
  website TEXT,
  bio TEXT,
  profile_picture_url TEXT,
  linkedin TEXT,
  twitter TEXT,
  instagram TEXT,
  facebook TEXT,
  profile_slug TEXT UNIQUE NOT NULL, -- Unique slug for web profile URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_slug ON user_profiles(profile_slug);
CREATE INDEX IF NOT EXISTS idx_user_profiles_qr_code_id ON user_profiles(qr_code_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profiles
CREATE POLICY "Users can view own profiles"
  ON user_profiles FOR SELECT
  USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own profiles
CREATE POLICY "Users can insert own profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own profiles
CREATE POLICY "Users can update own profiles"
  ON user_profiles FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Policy: Public can view profiles by slug (for web profile pages)
CREATE POLICY "Public can view profiles by slug"
  ON user_profiles FOR SELECT
  USING (true);

