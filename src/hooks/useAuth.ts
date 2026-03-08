'use client';

import { authClient, signOut as betterAuthSignOut } from '@/lib/auth-client';
import { useCallback } from 'react';
import useSWR from 'swr';

// SWR fetcher to get the current session state via Better Auth client
const fetchSession = async () => {
    const { data, error } = await authClient.getSession();
    if (error) throw error;
    return data;
};

export function useAuth() {
    // SWR automatically deduplicates multiple simultaneous calls into a single network request.
    // It also handles caching and revalidation automatically.
    const { data: session, isLoading, mutate } = useSWR('auth-session', fetchSession, {
        revalidateOnFocus: false, // Prevent extra fetches when switching tabs
        dedupingInterval: 2000,   // Deduplicate requests made within 2 seconds
    });

    const signOut = useCallback(async () => {
        await betterAuthSignOut();
        // Clear the local SWR cache immediately so UI reflects logged out state
        mutate(null, false);
    }, [mutate]);

    return {
        user: session?.user ?? null,
        loading: isLoading,
        signOut
    };
}
