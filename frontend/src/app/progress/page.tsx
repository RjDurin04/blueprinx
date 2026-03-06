'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useArchitectStore } from '@/stores/architect-store';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ProgressPage() {
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);
    const { statusLog, isGenerating, error, generatedPlan, startGeneration } = useArchitectStore();
    const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);

    const handleViewPlan = async () => {
        setIsNavigating(true);
        // Prefetch Blueprint page immediately to warm up the cache
        router.prefetch('/blueprint');
        await new Promise(resolve => setTimeout(resolve, 2000));
        router.push('/blueprint');
    };

    // Prefetch as soon as the button is likely to be visible
    useEffect(() => {
        const shouldShowButton = displayedLogs.includes("Writing the final plan...") || !isGenerating;
        if (shouldShowButton && !error) {
            router.prefetch('/blueprint');
        }
    }, [displayedLogs, isGenerating, error, router]);

    const handleRetry = async () => {
        setDisplayedLogs([]);
        await startGeneration();
    };

    // ── Staggered Log Reveal ──
    const lastProcessedIndex = useRef(-1);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (statusLog.length > displayedLogs.length) {
            // If we have new logs and aren't already waiting to display one
            if (timeoutRef.current === null) {
                const processNext = () => {
                    setDisplayedLogs(prev => {
                        const nextIndex = prev.length;
                        if (nextIndex < statusLog.length) {
                            return [...prev, statusLog[nextIndex]];
                        }
                        return prev;
                    });
                    timeoutRef.current = null;
                };

                // Add a small delay between each item
                timeoutRef.current = setTimeout(processNext, 600);
            }
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [statusLog, displayedLogs.length]);

    return (
        <div className="w-full mx-auto flex flex-col items-center px-4 sm:px-8 md:px-6 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] max-w-[720px]">
            <div className="w-full min-h-[50vh] sm:min-h-[60vh] flex flex-col items-center justify-center text-center mt-4 sm:mt-6 md:mt-8">
                <div className="relative mb-6 sm:mb-10">
                    <div className="absolute inset-0 bg-[#C8956C]/10 blur-2xl sm:blur-3xl rounded-full will-change-transform" />
                    {isGenerating && (
                        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 animate-spin text-[#C8956C] relative z-10" />
                    )}
                </div>

                <h2 className="text-[clamp(1.25rem,3vw,2.5rem)] font-light tracking-[-0.02em] text-[#0C0C1D] mb-6 sm:mb-8 md:mb-12">
                    Building your plan
                </h2>

                <div className="w-full max-w-[400px] flex flex-col gap-3 sm:gap-4 text-left mb-8 sm:mb-12 md:mb-16 px-2 sm:px-0 min-h-[120px]">
                    {displayedLogs.length === 0 && isGenerating ? (
                        <>
                            <div className="flex items-center gap-4 animate-pulse">
                                <Skeleton className="w-2 h-2 rounded-full" />
                                <Skeleton className="h-3 w-40" />
                            </div>
                            <div className="flex items-center gap-4 animate-pulse opacity-60">
                                <Skeleton className="w-2 h-2 rounded-full" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <div className="flex items-center gap-4 animate-pulse opacity-30">
                                <Skeleton className="w-2 h-2 rounded-full" />
                                <Skeleton className="h-3 w-44" />
                            </div>
                        </>
                    ) : (
                        displayedLogs.map((log, i) => {
                            const isLast = i === displayedLogs.length - 1;
                            const isActuallyDone = !isGenerating && i === statusLog.length - 1;

                            return (
                                <div
                                    key={`${i}-${log}`}
                                    className="flex items-start gap-3 sm:gap-4 animate-fadeSlideIn"
                                    style={{ animationDelay: `${i * 80}ms` }}
                                >
                                    <div
                                        className={`mt-1.5 shrink-0 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isLast && isGenerating
                                            ? 'bg-[#C8956C] animate-pulse shadow-[var(--shadow-glow)]'
                                            : 'bg-[#6B8F71]'
                                            }`}
                                    />
                                    <span
                                        className={`text-[10px] sm:text-[11px] md:text-[12px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] ${isLast && isGenerating ? 'text-[#0C0C1D]' : 'text-[#A0A0A8]'
                                            }`}
                                    >
                                        {log}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>

                {error && (
                    <div
                        className="mb-6 sm:mb-8 mx-2 sm:mx-0 p-3 sm:p-4 text-[11px] sm:text-[12px] text-[#D94F4F] bg-[#D94F4F]/[0.05] border border-[#D94F4F]/20"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        {error}
                    </div>
                )}

                {(error || (displayedLogs.length > 0 && (displayedLogs.includes("Writing the final plan...") || !isGenerating))) && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto px-2 sm:px-0">
                        <Link
                            href="/"
                            className="flex items-center justify-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#0C0C1D] border border-[#E8E4E0] px-6 sm:px-8 py-3 sm:py-3.5 hover:border-[#C8956C] hover:text-[#C8956C] transition-all duration-[var(--duration-normal)] whitespace-nowrap"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Back
                        </Link>
                        {error && (
                            <button
                                onClick={handleRetry}
                                className="flex items-center justify-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#FAFAF7] bg-[#0C0C1D] px-6 sm:px-8 py-3 sm:py-3.5 hover:bg-[#C8956C] transition-colors duration-[var(--duration-normal)] whitespace-nowrap animate-fadeSlideIn"
                            >
                                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Retry
                            </button>
                        )}
                        {(displayedLogs.includes("Writing the final plan...") || !isGenerating) && !error && (
                            <button
                                onClick={handleViewPlan}
                                disabled={isNavigating || (!generatedPlan && isGenerating)}
                                className="flex items-center justify-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#FAFAF7] bg-[#0C0C1D] px-6 sm:px-8 py-3 sm:py-3.5 hover:bg-[#C8956C] transition-colors duration-[var(--duration-normal)] disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap animate-fadeSlideIn"
                            >
                                {isNavigating && (
                                    <div className="w-3 h-3 border-2 border-[#FAFAF7]/30 border-t-[#FAFAF7] rounded-full animate-spin" />
                                )}
                                {isNavigating ? 'Preparing Plan...' : 'View Plan'} <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
