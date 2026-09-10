// Server Supabase client for secure server-side operations
// CRITICAL: This file and SUPABASE_SERVICE_ROLE_KEY must NEVER be imported or exposed to browser code.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let serverClient: SupabaseClient | null = null;

export const getSupabaseServerClient = (): SupabaseClient | null => {
  if (serverClient) return serverClient;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  serverClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
};
