'use server';

import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';
import type { Plan } from '@/types/plan';

/**
 * Extracts the authenticated user ID.
 * Uses Better Auth to securely verify the session using the request headers.
 */
async function getAuthUserId(): Promise<string | null> {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    return session?.user?.id ?? null;
}

export async function getPlans(): Promise<Plan[]> {
    noStore();
    const supabase = await createClient();
    const userId = await getAuthUserId();

    if (!userId) {
        return [];
    }

    const { data, error } = await supabase
        .from('plans')
        .select('id, title, prompt, status, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        return [];
    }

    return (data as Plan[]) || [];
}

export async function getPlan(planId: string): Promise<Plan | null> {
    noStore();
    const supabase = await createClient();
    const userId = await getAuthUserId();

    if (!userId) {
        return null;
    }

    const { data, error } = await supabase
        .from('plans')
        .select('id, title, prompt, content, status, created_at, updated_at')
        .eq('id', planId)
        .eq('user_id', userId)
        .single();

    if (error) {
        return null;
    }

    return data as Plan;
}



export async function removePlan(planId: string): Promise<boolean> {
    const supabase = await createClient();
    const userId = await getAuthUserId();

    if (!userId) {
        return false;
    }

    const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', userId);

    if (error) {
        return false;
    }

    return true;
}
