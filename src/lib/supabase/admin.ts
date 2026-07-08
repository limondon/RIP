import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl, isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export function getSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) return null;

  return createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
