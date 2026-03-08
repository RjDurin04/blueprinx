'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Copy, Download, Check, ArrowUp, Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import { useArchitectStore } from '@/stores/architect-store';
import { BlueprintSidebar } from '../components/BlueprintSidebar';

const MarkdownRenderer = dynamic(
    () => import('@/components/ui/MarkdownRenderer').then((mod) => mod.MarkdownRenderer),
    {
        loading: () => (
            <div className="w-full space-y-4 animate-pulse pt-4">
                <div className="h-4 bg-[#E8E4E0] rounded w-3/4"></div>
                <div className="h-4 bg-[#E8E4E0] rounded w-full"></div>
                <div className="h-4 bg-[#E8E4E0] rounded w-5/6"></div>
            </div>
        )
    }
);
import type { Plan } from '@/types/plan';

export default function SavedBlueprintPage() {
    const params = useParams();
    const { startGeneration, reset, statusLog, isGenerating, error: storeError, savedPlanId } = useArchitectStore();

    const currentIsGenerating = isGenerating && savedPlanId === params.id;
    const currentError = savedPlanId === params.id ? storeError : null;

    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const planId = params.id as string;

    // SWR handles fetching, polling, deduplication, and race-conditions flawlessly.
    const shouldPoll = plan?.status === 'generating' || (currentIsGenerating && plan?.status !== 'completed' && plan?.status !== 'error' && plan?.status !== 'failed');

    useSWR(
        planId ? `plan-${planId}` : null,
        async () => {
            const data = await useArchitectStore.getState().loadPlan(planId);
            if (!data) throw new Error('Plan not found');
            return data;
        },
        {
            // Only poll if the plan is generating
            refreshInterval: shouldPoll ? 30000 : 0,
            revalidateOnFocus: true,
            dedupingInterval: 2000,
            onSuccess: (data) => {
                setPlan((prev) => {
                    if (!prev) return data as Plan;
                    if (data.status === prev.status && data.content === prev.content && data.title === prev.title) {
                        return prev;
                    }
                    return { ...prev, ...data } as Plan;
                });

                if (data.status === 'completed' || data.status === 'error' || data.status === 'failed') {
                    if (useArchitectStore.getState().savedPlanId === planId) {
                        useArchitectStore.setState({ isGenerating: false });
                    }
                }
                setLoading(false);
                setError(null);
            },
            onError: () => {
                if (!plan) setError('Failed to load plan.');
                setLoading(false);
            }
        }
    );

    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 300);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const tableOfContents = useMemo(() => {
        if (!plan?.content) return [];
        return plan.content
            .split('\n')
            .filter((line) => /^\s*#{1,4}\s+/.test(line))
            .map((line) => {
                const match = line.match(/^(\s*)(#{1,4})\s+(.*)$/);
                if (!match) return null;
                return { level: match[2].length, text: match[3].trim() };
            })
            .filter(Boolean) as { level: number; text: string }[];
    }, [plan?.content]);

    const handleCopy = useCallback(async () => {
        if (!plan) return;
        try {
            await navigator.clipboard.writeText(plan.content);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch {
            // failed to copy silently
        }
    }, [plan]);

    const handleDownload = useCallback(
        (format: 'md' | 'txt') => {
            if (!plan) return;
            const blob = new Blob([plan.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${plan.title || 'Plan'}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        [plan]
    );

    const scrollToSection = useCallback((text: string) => {
        const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
        const target = elements.find((el) => el.textContent?.trim() === text);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    const handleRetry = async () => {
        if (!plan) return;
        reset();
        useArchitectStore.setState({ prompt: plan.prompt, savedPlanId: plan.id });
        setPlan(prev => prev ? { ...prev, status: 'generating', content: '' } : prev);
        startGeneration(plan.id);
    };

    const isActuallyGenerating = plan?.status === 'generating' || (currentIsGenerating && plan?.status !== 'completed' && plan?.status !== 'error' && plan?.status !== 'failed');

    const effectiveStatusLog = useMemo(() => {
        if (isActuallyGenerating) {
            return statusLog.length > 0 ? statusLog : ['Connecting to AI Engine...'];
        }
        if (plan?.status === 'completed') {
            return ['Plan generated successfully'];
        }
        return ['Plan loaded successfully'];
    }, [isActuallyGenerating, plan?.status, statusLog]);


    if (loading) {
        return (
            <div className="w-full flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#C8956C]" />
            </div>
        );
    }

    if (error || !plan) {
        return (
            <div className="w-full flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <p className="text-[14px] text-[#6E6E7A] mb-4">{error || 'Plan not found.'}</p>
                <Link
                    href="/dashboard"
                    className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C8956C] border border-[#C8956C] px-6 py-3 hover:bg-[#C8956C] hover:text-[#FAFAF7] transition-all"
                    style={{ borderRadius: 'var(--radius)' }}
                >
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-[#FAFAF7] selection:bg-[#C8956C]/20">
            {/* Scroll to Top */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-[env(safe-area-inset-bottom,2rem)] right-6 z-[100] min-h-[44px] min-w-[44px] flex items-center justify-center bg-[#0C0C1D] text-[#FAFAF7] rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border border-[#FAFAF7]/10 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'
                    }`}
                aria-label="Scroll to top"
            >
                <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="w-full mx-auto flex flex-col px-3 sm:px-6 md:px-8 max-w-[1200px]">
                <div className="w-full flex flex-col lg:grid lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] gap-4 sm:gap-6 lg:gap-8 xl:gap-12 mt-4 sm:mt-6 lg:mt-8 mb-16 sm:mb-24 lg:mb-32 lg:items-start">

                    {/* ── Sidebar ── */}
                    <BlueprintSidebar
                        prompt={plan.prompt}
                        isGenerating={isActuallyGenerating}
                        error={currentError || (plan.status === 'error' ? 'Something went wrong' : null)}
                        tableOfContents={tableOfContents}
                        scrollToSection={scrollToSection}
                        handleReset={reset}
                        onRetry={handleRetry}
                        hasPlan={true}
                    />

                    {/* ── Main Content ── */}
                    <div
                        className="w-full min-w-0 overflow-hidden bg-[#FAFAF7] border border-[#E8E4E0] p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 shadow-[var(--shadow-float)] min-h-[300px] relative group"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        {isActuallyGenerating ? (
                            <div className="flex flex-col items-center justify-center py-16 sm:py-24 lg:py-32">
                                {/* Animated orb */}
                                <div className="relative mb-10">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C8956C] to-[#A67B5B] animate-pulse shadow-[0_0_40px_rgba(200,149,108,0.3)]" />
                                    <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-[#C8956C]/30 animate-ping" />
                                    <div className="absolute inset-[-8px] w-[calc(5rem+16px)] h-[calc(5rem+16px)] rounded-full border border-dashed border-[#C8956C]/20 animate-[spin_8s_linear_infinite]" />
                                </div>

                                {/* Title */}
                                <h3 className="text-[14px] sm:text-[16px] font-semibold text-[#0C0C1D] uppercase tracking-[0.15em] mb-3">
                                    Building Your Blueprint
                                </h3>
                                <p className="text-[11px] sm:text-[12px] text-[#6E6E7A] text-center max-w-[340px] leading-relaxed mb-3">
                                    AI is crafting your plan. This may take a few minutes.
                                </p>
                                <p className="text-[10px] sm:text-[11px] text-[#A0A0A8] text-center max-w-[320px] leading-relaxed mb-8 italic">
                                    Feel free to leave this page — your plan will be ready when you come back.
                                </p>

                                {/* Animated progress steps */}
                                <div className="flex flex-col gap-3 w-full max-w-[280px]">
                                    {effectiveStatusLog.map((step, i) => {
                                        const isLast = i === effectiveStatusLog.length - 1;
                                        return (
                                            <div
                                                key={`${i}-${step}`}
                                                className="flex items-center gap-3 animate-fadeSlideIn"
                                                style={{ animationDelay: `${i * 150}ms` }}
                                            >
                                                <div className={`w-2 h-2 rounded-full shrink-0 ${isLast ? 'bg-[#C8956C] animate-pulse' : 'bg-[#C8956C]/40'
                                                    }`} />
                                                <span className={`text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.1em] ${isLast ? 'text-[#C8956C]' : 'text-[#A0A0A8]'
                                                    }`}>
                                                    {step}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Subtle skeleton hint */}
                                <div className="w-full mt-12 space-y-3 opacity-30">
                                    <div className="h-3 bg-[#E8E4E0] rounded w-1/2 mx-auto animate-pulse" />
                                    <div className="h-2 bg-[#E8E4E0] rounded w-3/4 mx-auto animate-pulse" style={{ animationDelay: '150ms' }} />
                                    <div className="h-2 bg-[#E8E4E0] rounded w-2/3 mx-auto animate-pulse" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Actions Bar */}
                                <div
                                    className="flex gap-1 sm:gap-2 sm:absolute sm:top-6 sm:right-6 mb-4 sm:mb-0 self-end opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-[#FAFAF7] p-1 border border-[#E8E4E0] shadow-sm z-10"
                                    style={{ borderRadius: 'var(--radius)' }}
                                >
                                    <button onClick={handleCopy} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#6E6E7A] hover:text-[#0C0C1D] hover:bg-[#F0EDE8] transition-colors rounded-md" title="Copy plan">
                                        {isCopied ? <Check className="w-4 h-4 text-[#6B8F71]" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                    <div className="w-px h-6 bg-[#E8E4E0] my-auto mx-0 sm:mx-1" />
                                    <button onClick={() => handleDownload('md')} className="min-h-[44px] px-3 flex items-center justify-center text-[#6E6E7A] hover:text-[#0C0C1D] hover:bg-[#F0EDE8] transition-colors rounded-md gap-1" title="Download (.md)">
                                        <Download className="w-4 h-4" />
                                        <span className="text-[9px] font-medium uppercase tracking-wider">.md</span>
                                    </button>
                                    <button onClick={() => handleDownload('txt')} className="min-h-[44px] px-3 flex items-center justify-center text-[#6E6E7A] hover:text-[#0C0C1D] hover:bg-[#F0EDE8] transition-colors rounded-md gap-1" title="Download (.txt)">
                                        <Download className="w-4 h-4" />
                                        <span className="text-[9px] font-medium uppercase tracking-wider">.txt</span>
                                    </button>
                                </div>

                                {(plan.status === 'failed' || plan.status === 'error') && (
                                    <div className="mb-8 p-4 bg-[#D94F4F]/5 border border-[#D94F4F]/20 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div>
                                            <h4 className="text-[12px] font-medium text-[#D94F4F] mb-1 flex items-center gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5" /> Generation Interrupted
                                            </h4>
                                            <p className="text-[11px] text-[#D94F4F]/80">
                                                The AI connection was lost before finishing. You can view the partial plan below, or retry generation.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleRetry}
                                            className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#FAFAF7] bg-[#0C0C1D] px-4 py-2 hover:bg-[#C8956C] transition-colors flex items-center gap-2"
                                            style={{ borderRadius: 'var(--radius)' }}
                                        >
                                            <RefreshCcw className="w-3 h-3" /> Retry Generation
                                        </button>
                                    </div>
                                )}

                                <MarkdownRenderer content={plan.content} />
                                <div className="h-4" />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
