import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')
);

if (!isSupabaseConfigured) {
  console.error(
    '[Supabase] Missing or invalid configuration. ' +
    'Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project settings.'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
