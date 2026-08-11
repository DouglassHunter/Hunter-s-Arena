-- Hunter's Arena Scalable Multi-Game Platform Database Schema
-- Compatible with PostgreSQL and Supabase

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  avatar_url TEXT DEFAULT 'https://api.dicebear.com/7.x/bottts/svg?seed=Player',
  bio TEXT DEFAULT 'Gamer on Hunter''s Arena',
  sound_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER DEFAULT 1000,
  global_rank INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Games Registry Table (Extensible for future games: Connect Four, Checkers, Chess, etc.)
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon_name VARCHAR(50) DEFAULT 'Gamepad2',
  min_players INTEGER DEFAULT 2,
  max_players INTEGER DEFAULT 2,
  active BOOLEAN DEFAULT true,
  category VARCHAR(50) DEFAULT 'Strategy',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Game Specific Statistics Table
CREATE TABLE IF NOT EXISTS player_game_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  total_games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  UNIQUE(user_id, game_id)
);

-- 5. Game Rooms Table
CREATE TABLE IF NOT EXISTS game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(10) UNIQUE NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, in_game, finished
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  room_code VARCHAR(10),
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_draw BOOLEAN DEFAULT false,
  score_summary VARCHAR(50),
  details JSONB,
  ended_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Match Players Table
CREATE TABLE IF NOT EXISTS match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  player_number INTEGER NOT NULL, -- 1 or 2
  rating_before INTEGER NOT NULL,
  rating_after INTEGER NOT NULL,
  rating_change INTEGER NOT NULL,
  UNIQUE(match_id, user_id)
);

-- 8. Friends Table
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id)
);

-- 9. Friend Requests Table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sender_id, receiver_id)
);

-- Insert Default Games
INSERT INTO games (name, slug, description, icon_name, min_players, max_players, active, category)
VALUES 
  ('Tic-Tac-Toe', 'tic-tac-toe', 'Classic 3x3 strategic line match. Outsmart your opponent in real-time.', 'Grid3X3', 2, 2, true, 'Strategy'),
  ('Rock-Paper-Scissors', 'rock-paper-scissors', 'Best-of-5 competitive showdown with simultaneous choices.', 'HandMetal', 2, 2, true, 'Action')
ON CONFLICT (slug) DO NOTHING;
