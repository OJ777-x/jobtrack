import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Full-access client using the SERVICE ROLE key — bypasses Row Level Security.
// Only ever use this on the server, for admin tasks like seeding demo data or
// switching an organisation's template. NEVER import this into client code.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your .env.local"
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
