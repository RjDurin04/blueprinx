'use client';

import { create } from 'zustand';

interface ArchitectState {
    prompt: string;
    generatedPlan: string;
    isGenerating: boolean;
    error: string | null;
    statusLog: string[];

    setPrompt: (prompt: string) => void;
    startGeneration: () => Promise<void>;
    reset: () => void;
}

export const useArchitectStore = create<ArchitectState>((set, get) => ({
    prompt: '',
    generatedPlan: '',
    isGenerating: false,
    error: null,
    statusLog: [],

    setPrompt: (prompt: string) => set({ prompt }),

    startGeneration: async () => {
        const { prompt } = get();
        if (!prompt.trim()) return;

        set({
            isGenerating: true,
            generatedPlan: '',
            error: null,
            statusLog: ['Connecting to AI engine...'],
        });

        try {
            const response = await fetch('http://localhost:3001/api/v1/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                let errorMsg = 'Failed to connect to the generation service.';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData?.error?.message || `API Error: ${response.status}`;
                } catch {
                    errorMsg = `Server returned ${response.status}`;
                }
                throw new Error(errorMsg);
            }

            if (!response.body) {
                throw new Error('ReadableStream not supported.');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            // ── Batched text accumulator ──
            // Instead of calling set() on every SSE chunk (which triggers a React re-render
            // per chunk), we accumulate text in a local variable and flush it at ~60fps
            // via requestAnimationFrame. This dramatically reduces re-renders during streaming.
            let pendingText = '';
            let rafId: number | null = null;

            const flushText = () => {
                if (pendingText) {
                    const textToFlush = pendingText;
                    pendingText = '';
                    set((state) => ({
                        generatedPlan: state.generatedPlan + textToFlush,
                    }));
                }
                rafId = null;
            };

            const scheduleFlush = () => {
                if (rafId === null) {
                    rafId = requestAnimationFrame(flushText);
                }
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') {
                            // Flush any remaining text before marking done
                            if (rafId !== null) {
                                cancelAnimationFrame(rafId);
                            }
                            flushText();
                            set({ isGenerating: false });
                            return;
                        }
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.text) {
                                // Accumulate text instead of immediate set()
                                pendingText += data.text;
                                scheduleFlush();
                            }
                            if (data.status) {
                                set((state) => {
                                    if (state.statusLog[state.statusLog.length - 1] === data.status) {
                                        return state;
                                    }
                                    return { statusLog: [...state.statusLog, data.status] };
                                });
                            }
                            if (data.error) {
                                if (rafId !== null) cancelAnimationFrame(rafId);
                                flushText();
                                set({ error: data.error, isGenerating: false });
                                return;
                            }
                        } catch {
                            console.warn('Could not parse chunk', dataStr);
                        }
                    }
                }
            }

            // Final flush in case stream ended without [DONE]
            if (rafId !== null) cancelAnimationFrame(rafId);
            flushText();
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error ? err.message : 'An unexpected error occurred.';
            console.error(err);
            set({ error: errorMessage, isGenerating: false });
        }
    },

    reset: () =>
        set({
            prompt: '',
            generatedPlan: '',
            isGenerating: false,
            error: null,
            statusLog: [],
        }),
}));
