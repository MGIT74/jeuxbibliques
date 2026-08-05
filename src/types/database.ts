export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          age_group: 'child' | 'teen' | 'adult';
          total_points: number;
          is_admin: boolean;
          is_blocked: boolean;
          blocked_at: string | null;
          blocked_reason: string | null;
          email: string | null;
          full_name: string | null;
          church_name: string | null;
          newsletter_consent: boolean;
          marketing_consent: boolean;
          consent_date: string | null;
          country: string | null;
          hearts: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          age_group?: 'child' | 'teen' | 'adult';
          total_points?: number;
          is_admin?: boolean;
          is_blocked?: boolean;
          blocked_at?: string | null;
          blocked_reason?: string | null;
          email?: string | null;
          full_name?: string | null;
          church_name?: string | null;
          newsletter_consent?: boolean;
          marketing_consent?: boolean;
          consent_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          avatar_url?: string | null;
          age_group?: 'child' | 'teen' | 'adult';
          total_points?: number;
          is_admin?: boolean;
          is_blocked?: boolean;
          blocked_at?: string | null;
          blocked_reason?: string | null;
          email?: string | null;
          full_name?: string | null;
          church_name?: string | null;
          newsletter_consent?: boolean;
          marketing_consent?: boolean;
          consent_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          cover_image_url: string | null;
          min_age: number;
          difficulty_levels: string[];
          is_active?: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          min_age?: number;
          difficulty_levels?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          min_age?: number;
          difficulty_levels?: string[];
          created_at?: string;
        };
      };
      scores: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          score: number;
          max_score: number;
          difficulty: string;
          time_spent: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          score: number;
          max_score: number;
          difficulty?: string;
          time_spent?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          score?: number;
          max_score?: number;
          difficulty?: string;
          time_spent?: number;
          created_at?: string;
        };
      };
      progress: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          level: number;
          games_played: number;
          best_score: number;
          last_played_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          level?: number;
          games_played?: number;
          best_score?: number;
          last_played_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          level?: number;
          games_played?: number;
          best_score?: number;
          last_played_at?: string;
          updated_at?: string;
        };
      };
      verses: {
        Row: {
          id: string;
          reference: string;
          text: string;
          book: string;
          chapter: number;
          verse_number: number;
          difficulty: 'easy' | 'medium' | 'hard';
          speaker: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reference: string;
          text: string;
          book: string;
          chapter: number;
          verse_number: number;
          difficulty?: 'easy' | 'medium' | 'hard';
          speaker?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reference?: string;
          text?: string;
          book?: string;
          chapter?: number;
          verse_number?: number;
          difficulty?: 'easy' | 'medium' | 'hard';
          speaker?: string | null;
          created_at?: string;
        };
      };
      quiz_questions: {
        Row: {
          id: string;
          game_type: 'quiz' | 'true_false' | 'who_said' | 'character_match';
          question: string;
          correct_answer: string;
          wrong_answers: string[];
          explanation: string | null;
          difficulty: 'easy' | 'medium' | 'hard';
          category: string | null;
          verse_reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_type: 'quiz' | 'true_false' | 'who_said' | 'character_match';
          question: string;
          correct_answer: string;
          wrong_answers?: string[];
          explanation?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard';
          category?: string | null;
          verse_reference?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_type?: 'quiz' | 'true_false' | 'who_said' | 'character_match';
          question?: string;
          correct_answer?: string;
          wrong_answers?: string[];
          explanation?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard';
          category?: string | null;
          verse_reference?: string | null;
          created_at?: string;
        };
      };
      bible_words: {
        Row: {
          id: string;
          word: string;
          hint: string | null;
          category: string | null;
          difficulty: 'easy' | 'medium' | 'hard';
          created_at: string;
        };
        Insert: {
          id?: string;
          word: string;
          hint?: string | null;
          category?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard';
          created_at?: string;
        };
        Update: {
          id?: string;
          word?: string;
          hint?: string | null;
          category?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard';
          created_at?: string;
        };
      };
      bible_characters: {
        Row: {
          id: string;
          name: string;
          story_title: string;
          story_description: string | null;
          book: string | null;
          difficulty: 'easy' | 'medium' | 'hard';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          story_title: string;
          story_description?: string | null;
          book?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          story_title?: string;
          story_description?: string | null;
          book?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard';
          created_at?: string;
        };
      };
      banners: {
        Row: {
          id: string;
          title: string;
          image_url: string;
          link_url: string | null;
          is_active: boolean;
          display_order: number;
          duration_seconds: number;
          start_date: string | null;
          end_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          image_url: string;
          link_url?: string | null;
          is_active?: boolean;
          display_order?: number;
          duration_seconds?: number;
          start_date?: string | null;
          end_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          image_url?: string;
          link_url?: string | null;
          is_active?: boolean;
          display_order?: number;
          duration_seconds?: number;
          start_date?: string | null;
          end_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      donation_settings: {
        Row: {
          id: string;
          iframe_code: string;
          is_active: boolean;
          show_user_counter: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          iframe_code?: string;
          is_active?: boolean;
          show_user_counter?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          iframe_code?: string;
          is_active?: boolean;
          show_user_counter?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Game = Database['public']['Tables']['games']['Row'];
export type Score = Database['public']['Tables']['scores']['Row'];
export type Progress = Database['public']['Tables']['progress']['Row'];
export type Verse = Database['public']['Tables']['verses']['Row'];
export type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row'];
export type BibleWord = Database['public']['Tables']['bible_words']['Row'];
export type BibleCharacter = Database['public']['Tables']['bible_characters']['Row'];
export type Banner = Database['public']['Tables']['banners']['Row'];
export type DonationSettings = Database['public']['Tables']['donation_settings']['Row'];

export interface SmtpSettings {
  id?: string;
  host: string | null;
  port: number | null;
  secure: boolean;
  username: string | null;
  from_email: string | null;
  from_name: string | null;
  is_active: boolean;
  require_email_verification: boolean;
  has_password: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'urgent';
  is_active?: boolean;
  created_at: string;
}

export interface Card {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  points_threshold: number;
  hearts_reward: number;
  is_active?: boolean;
  display_order?: number;
  unlocked_at?: string;
  seen?: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface AdminStats {
  total_users: number;
  new_users_week: number;
  new_users_month: number;
  total_games_played: number;
  games_played_week: number;
  total_points_earned: number;
  avg_score_percentage: number;
}

export interface UserWithStats extends Profile {
  games_played?: number;
  last_activity?: string;
}

export interface MarketingUser {
  id: string;
  username: string | null;
  email: string | null;
  full_name: string | null;
  newsletter_consent: boolean;
  marketing_consent: boolean;
  consent_date: string | null;
  created_at: string;
}
