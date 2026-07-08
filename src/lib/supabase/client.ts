"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

let browserClient: SupabaseClient<Database> | null = null;

export function getBrowserSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createClient<Database>(getSupabaseUrl(), getSupabasePublishableKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return browserClient;
}
