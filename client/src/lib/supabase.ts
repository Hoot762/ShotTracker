import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key';

// Create a mock client if environment variables are not set
const createSupabaseClient = () => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not configured. Using demo mode.');
    
    // Return a mock client for demo purposes
    return {
      auth: {
        signInWithPassword: async () => ({ 
          data: { user: { id: 'demo-user', email: 'demo@example.com' } }, 
          error: null 
        }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ 
          data: { user: { id: 'demo-user', email: 'demo@example.com' } }, 
          error: null 
        }),
        getSession: async () => ({ 
          data: { session: { user: { id: 'demo-user', email: 'demo@example.com' } } }, 
          error: null 
        }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        admin: {
          createUser: async () => ({ 
            data: { user: { id: 'new-user', email: 'new@example.com' } }, 
            error: null 
          }),
          deleteUser: async () => ({ error: null }),
        }
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({ data: [], error: null }),
            single: () => ({ data: null, error: null }),
          }),
          order: () => ({ data: [], error: null }),
        }),
        insert: () => ({
          select: () => ({
            single: () => ({ data: {}, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => ({ data: {}, error: null }),
            }),
          }),
        }),
        delete: () => ({
          eq: () => ({ error: null }),
        }),
      }),
      storage: {
        from: () => ({
          upload: async () => ({ error: null }),
          getPublicUrl: () => ({ data: { publicUrl: 'https://via.placeholder.com/300' } }),
        }),
      },
    };
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();

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