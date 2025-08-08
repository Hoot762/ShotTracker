import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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