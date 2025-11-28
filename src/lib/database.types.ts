export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          description: string;
          photo_url: string | null;
          quality_score: number | null;
          calories_estimate: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          description: string;
          photo_url?: string | null;
          quality_score?: number | null;
          calories_estimate?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          description?: string;
          photo_url?: string | null;
          quality_score?: number | null;
          calories_estimate?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      social_posts: {
        Row: {
          id: string;
          user_id: string;
          meal_id: string | null;
          content: string;
          media_url: string | null;
          media_type: 'photo' | 'video' | null;
          likes_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          meal_id?: string | null;
          content: string;
          media_url?: string | null;
          media_type?: 'photo' | 'video' | null;
          likes_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          meal_id?: string | null;
          content?: string;
          media_url?: string | null;
          media_type?: 'photo' | 'video' | null;
          likes_count?: number;
          created_at?: string;
        };
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
  };
};
