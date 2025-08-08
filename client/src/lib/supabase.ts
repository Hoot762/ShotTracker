import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'your_supabase_project_url_here' || 
    supabaseAnonKey === 'your_supabase_anon_key_here') {
  console.error('❌ Supabase environment variables are not configured properly!');
  console.error('📝 Please update your .env file with your actual Supabase credentials:');
  console.error('   1. Go to https://supabase.com/dashboard');
  console.error('   2. Select your project');
  console.error('   3. Go to Settings > API');
  console.error('   4. Copy your Project URL and anon/public key');
  console.error('   5. Update the .env file in your project root');
  console.error('   6. Restart the development server');
}

// Export a flag to check if we're in demo mode
export const isDemoMode = !supabaseUrl || !supabaseAnonKey || 
  supabaseUrl === 'your_supabase_project_url_here' || 
  supabaseAnonKey === 'your_supabase_anon_key_here';

// Only create client if we have valid credentials
export const supabase = isDemoMode 
  ? null 
  : createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          is_admin?: boolean;
          created_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          date: string;
          rifle: string;
          calibre: string;
          bullet_weight: number;
          distance: number;
          elevation: number | null;
          windage: number | null;
          shots: string[];
          total_score: number;
          v_count: number;
          photo_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          date: string;
          rifle: string;
          calibre: string;
          bullet_weight: number;
          distance: number;
          elevation?: number | null;
          windage?: number | null;
          shots: string[];
          total_score: number;
          v_count: number;
          photo_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          date?: string;
          rifle?: string;
          calibre?: string;
          bullet_weight?: number;
          distance?: number;
          elevation?: number | null;
          windage?: number | null;
          shots?: string[];
          total_score?: number;
          v_count?: number;
          photo_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      dope_cards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          rifle: string;
          calibre: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          rifle: string;
          calibre: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          rifle?: string;
          calibre?: string;
          created_at?: string;
        };
      };
      dope_ranges: {
        Row: {
          id: string;
          dope_card_id: string;
          range: number;
          elevation: number | null;
          windage: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          dope_card_id: string;
          range: number;
          elevation?: number | null;
          windage?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          dope_card_id?: string;
          range?: number;
          elevation?: number | null;
          windage?: number | null;
          created_at?: string;
        };
      };
    };
  };
};