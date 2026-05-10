-- 1. PROFILES Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  department TEXT,
  student_id TEXT,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RIDES Table
CREATE TABLE IF NOT EXISTS rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  from_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  ride_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  seats_available INTEGER NOT NULL CHECK (seats_available > 0),
  vehicle_type TEXT NOT NULL,
  notes TEXT,
  women_only BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Full', 'Cancelled', 'Completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. JOIN_REQUESTS Table
CREATE TABLE IF NOT EXISTS join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ride_id, user_id)
);

-- 4. RIDE_MEMBERS Table
CREATE TABLE IF NOT EXISTS ride_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ride_id, user_id)
);

-- 5. CHATS Table
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 6. MESSAGES Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS ENABLEMENT
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- POLICIES (Cleaning up existing ones first)

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Rides
DROP POLICY IF EXISTS "Rides are viewable by everyone." ON rides;
DROP POLICY IF EXISTS "Authenticated users can create rides." ON rides;
DROP POLICY IF EXISTS "Creators can update their rides." ON rides;
CREATE POLICY "Rides are viewable by everyone." ON rides FOR SELECT USING (
  NOT women_only OR (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND gender = 'Female')
  )
);
CREATE POLICY "Authenticated users can create rides." ON rides FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their rides." ON rides FOR UPDATE USING (auth.uid() = creator_id);

-- Join Requests
DROP POLICY IF EXISTS "Users can see their own requests or for their rides." ON join_requests;
DROP POLICY IF EXISTS "Users can request to join." ON join_requests;
CREATE POLICY "Users can see their own requests or for their rides." ON join_requests FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM rides WHERE id = ride_id AND creator_id = auth.uid())
);
CREATE POLICY "Users can request to join." ON join_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ride Members
DROP POLICY IF EXISTS "Members can see other members of the same ride." ON ride_members;
CREATE POLICY "Members can see other members of the same ride." ON ride_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM ride_members WHERE ride_id = ride_members.ride_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM rides WHERE id = ride_id AND creator_id = auth.uid())
);

-- Chats
DROP POLICY IF EXISTS "Members can see their chats." ON chats;
CREATE POLICY "Members can see their chats." ON chats FOR SELECT USING (
  EXISTS (SELECT 1 FROM ride_members WHERE ride_id = chats.ride_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM rides WHERE id = chats.ride_id AND creator_id = auth.uid())
);

-- Messages
DROP POLICY IF EXISTS "Members can see messages in their chats." ON messages;
DROP POLICY IF EXISTS "Members can send messages." ON messages;
CREATE POLICY "Members can see messages in their chats." ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chats 
    JOIN ride_members ON chats.ride_id = ride_members.ride_id 
    WHERE chats.id = messages.chat_id AND ride_members.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM chats 
    JOIN rides ON chats.ride_id = rides.id 
    WHERE chats.id = messages.chat_id AND rides.creator_id = auth.uid()
  )
);
CREATE POLICY "Members can send messages." ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND (
    EXISTS (
      SELECT 1 FROM chats 
      JOIN ride_members ON chats.ride_id = ride_members.ride_id 
      WHERE chats.id = messages.chat_id AND ride_members.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM chats 
      JOIN rides ON chats.ride_id = rides.id 
      WHERE chats.id = messages.chat_id AND rides.creator_id = auth.uid()
    )
  )
);

-- SECURE FUNCTION FOR NEW USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$;

-- Restrict execution of the function
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
