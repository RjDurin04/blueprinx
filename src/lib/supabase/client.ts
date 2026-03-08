import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Creates a Supabase client for browser-side DB operations.
 * Auth is handled entirely by Better Auth — this client is data-only.
 * Uses a singleton on the browser to prevent Web Locks API collisions.
 */
export function createClient() {
    // If we're on the server, always create a new client
    if (typeof window === 'undefined') {
        return createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    // If we're on the browser, use a singleton to prevent Web Locks API collisions
    if (!supabaseClient) {
        supabaseClient = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    return supabaseClient;
}
