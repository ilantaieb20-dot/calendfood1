/*
  # Food Tracking Application Schema

  ## 1. New Tables
    
    ### profiles
    - `id` (uuid, primary key, references auth.users)
    - `username` (text, unique)
    - `full_name` (text)
    - `avatar_url` (text, nullable)
    - `bio` (text, nullable)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
    
    ### meals
    - `id` (uuid, primary key)
    - `user_id` (uuid, references profiles)
    - `date` (date)
    - `meal_type` (text: breakfast, lunch, dinner, snack)
    - `description` (text)
    - `photo_url` (text, nullable)
    - `quality_score` (integer, 1-5)
    - `calories_estimate` (integer, nullable)
    - `notes` (text, nullable)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
    
    ### social_posts
    - `id` (uuid, primary key)
    - `user_id` (uuid, references profiles)
    - `meal_id` (uuid, references meals, nullable)
    - `content` (text)
    - `media_url` (text, nullable)
    - `media_type` (text: photo, video)
    - `likes_count` (integer)
    - `created_at` (timestamptz)
    
    ### post_likes
    - `id` (uuid, primary key)
    - `post_id` (uuid, references social_posts)
    - `user_id` (uuid, references profiles)
    - `created_at` (timestamptz)
    - Unique constraint on (post_id, user_id)
    
    ### post_comments
    - `id` (uuid, primary key)
    - `post_id` (uuid, references social_posts)
    - `user_id` (uuid, references profiles)
    - `content` (text)
    - `created_at` (timestamptz)

  ## 2. Security
    - Enable RLS on all tables
    - Profiles: Users can read all profiles, but only update their own
    - Meals: Users can manage only their own meals
    - Social posts: Users can read all posts, create their own, and delete only their own
    - Post likes: Users can like/unlike posts, read all likes
    - Post comments: Users can read all comments, create comments, delete only their own

  ## 3. Indexes
    - Index on meals(user_id, date) for efficient calendar queries
    - Index on social_posts(created_at) for feed pagination
    - Index on post_likes(post_id) for counting likes efficiently
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  description text NOT NULL,
  photo_url text,
  quality_score integer CHECK (quality_score >= 1 AND quality_score <= 5),
  calories_estimate integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meals"
  ON meals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
  ON meals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
  ON meals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
  ON meals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date);

-- Create social_posts table
CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meal_id uuid REFERENCES meals(id) ON DELETE SET NULL,
  content text NOT NULL,
  media_url text,
  media_type text CHECK (media_type IN ('photo', 'video')),
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone"
  ON social_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own posts"
  ON social_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON social_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts(created_at DESC);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON post_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can like posts"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON post_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON post_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON post_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id, created_at);