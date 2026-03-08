import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for server-side DB operations.
 * Auth is handled entirely by Better Auth — this client is data-only.
 */
export async function createClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
