'use client';

import { create } from 'zustand';
import { getPlans, getPlan, removePlan } from '@/app/actions/plans';
import type { Plan } from '@/types/plan';

interface ArchitectState {
    prompt: string;
    generatedPlan: string;
    isGenerating: boolean;
    error: string | null;
    statusLog: string[];
    savedPlanId: string | null;

    setPrompt: (prompt: string) => void;
    startGeneration: (planId?: string) => Promise<void>;
    loadPlans: () => Promise<Plan[]>;
    loadPlan: (planId: string) => Promise<Plan | null>;
    deletePlan: (planId: string) => Promise<boolean>;
    reset: () => void;
}

export const useArchitectStore = create<ArchitectState>((set, get) => ({
    prompt: '',
    generatedPlan: '',
    isGenerating: false,
    error: null,
    statusLog: [],
    savedPlanId: null,

    setPrompt: (prompt: string) => set({ prompt }),

    startGeneration: async (planId?: string) => {
        const { prompt } = get();
        if (!prompt.trim() && !planId) return;

        set({
            isGenerating: true,
            generatedPlan: '',
            error: null,
            statusLog: ['Connecting to AI engine...'],
            savedPlanId: planId || null,
        });

        // Fire-and-forget the generation process so the UI doesn't block
        const runGeneration = async () => {
            try {
                const response = await fetch('/api/ai/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, planId }),
                });

                const data = await response.json();

                if (!response.ok) {
                    set({ error: data?.error?.message || `API Error: ${response.status}`, isGenerating: false });
                    return;
                }

                const activePlanId = data.planId;
                set({ savedPlanId: activePlanId });

                // Since we moved to Trigger.dev + Supabase Realtime for background generation,
                // we simulate the "connecting" status progression locally while waiting for Realtime content streaming.
                const connectingStates = [
                    'Reviewing your idea...',
                    'Connecting to AI engine...',
                    'Building the plan...',
                    'Writing the final plan...'
                ];

                let simStep = 0;
                const simInterval = setInterval(() => {
                    simStep++;
                    if (simStep < connectingStates.length) {
                        set((state) => ({ statusLog: [...state.statusLog, connectingStates[simStep]] }));
                    } else {
                        clearInterval(simInterval);
                    }
                }, 3000);

                // Subscribe to Supabase Realtime for live content chunks
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();

                const channel = supabase.channel(`store-plan-${activePlanId}`)
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'plans',
                        filter: `id=eq.${activePlanId}`
                    }, (payload) => {
                        const updatedRow = payload.new as Plan;
                        const updates: Partial<ArchitectState> = {};

                        // 1. Sync content live (only if present in payload)
                        if (updatedRow.content !== undefined && updatedRow.content !== null) {
                            updates.generatedPlan = updatedRow.content;
                        }

                        // 2. Sync status and handle termination
                        const status = updatedRow.status;
                        if (status === 'completed' || status === 'failed' || status === 'error') {
                            updates.isGenerating = false;
                            clearInterval(simInterval);
                            supabase.removeChannel(channel);
                        } else if (status === 'generating') {
                            updates.isGenerating = true;
                        }

                        if (Object.keys(updates).length > 0) {
                            set(updates);
                        }
                    })
                    .subscribe();

                // 3. Fail-safe: immediately check status to handle the race condition
                // where the job finished before we subscribed.
                const { data: currentTask } = await supabase
                    .from('plans')
                    .select('status, content')
                    .eq('id', activePlanId)
                    .single();

                if (currentTask && (currentTask.status === 'completed' || currentTask.status === 'failed' || currentTask.status === 'error')) {
                    set({
                        isGenerating: false,
                        generatedPlan: currentTask.content || get().generatedPlan
                    });
                    clearInterval(simInterval);
                    supabase.removeChannel(channel);
                }
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
                set({ error: errorMessage, isGenerating: false });
            }
        };

        await runGeneration();
    },

    loadPlans: async () => {
        return await getPlans();
    },

    loadPlan: async (planId: string) => {
        return await getPlan(planId);
    },

    deletePlan: async (planId: string) => {
        return await removePlan(planId);
    },

    reset: () =>
        set({
            prompt: '',
            generatedPlan: '',
            isGenerating: false,
            error: null,
            statusLog: [],
            savedPlanId: null,
        }),
}));
