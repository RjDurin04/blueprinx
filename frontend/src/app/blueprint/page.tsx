'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Copy, Download, Check, ArrowUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { useArchitectStore } from '@/stores/architect-store';
import { BlueprintSidebar } from './components/BlueprintSidebar';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

export default function BlueprintPage() {
    const { statusLog, isGenerating, error, generatedPlan, reset, startGeneration } = useArchitectStore();
    const [isCopied, setIsCopied] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    // ── Scroll to Top Visibility ──
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── Throttled Table of Contents Calculation ──
    const tableOfContents = useMemo(() => {
        if (!generatedPlan) return [];

        return generatedPlan
            .split('\n')
            .filter((line) => /^\s*#{1,4}\s+/.test(line))
            .map((line) => {
                const match = line.match(/^(\s*)(#{1,4})\s+(.*)$/);
                if (!match) return null;
                const level = match[2].length;
                const text = match[3].trim();
                return { level, text };
            })
            .filter(Boolean) as { level: number; text: string }[];
    }, [generatedPlan]);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(generatedPlan);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text', err);
        }
    }, [generatedPlan]);

    const handleDownload = useCallback(
        (format: 'md' | 'txt') => {
            const blob = new Blob([generatedPlan], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `App_Plan.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        [generatedPlan]
    );

    const scrollToSection = useCallback((text: string) => {
        const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
        const target = elements.find((el) => el.textContent?.trim() === text);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    const handleReset = useCallback(() => {
        reset();
    }, [reset]);

    return (
        <div className="min-h-screen bg-[#FAFAF7] selection:bg-[#C8956C]/20">
            {/* ── Scroll to Top Button ── */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-8 right-8 z-[100] p-3 sm:p-4 bg-[#0C0C1D] text-[#FAFAF7] rounded-full shadow-2xl transition-all duration-300 ease-[var(--ease-out-expo)] hover:scale-110 active:scale-95 border border-[#FAFAF7]/10 group ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'
                    }`}
                aria-label="Scroll to top"
            >
                <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:-translate-y-1" />
            </button>

            <div className="w-full mx-auto flex flex-col items-center px-3 sm:px-6 md:px-8 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] max-w-[1200px]">
                <div className="w-full flex flex-col lg:grid lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] gap-4 sm:gap-6 lg:gap-8 xl:gap-12 mt-4 sm:mt-6 lg:mt-8 mb-16 sm:mb-24 lg:mb-32 items-start">

                    <BlueprintSidebar
                        statusLog={statusLog}
                        isGenerating={isGenerating}
                        error={error}
                        tableOfContents={tableOfContents}
                        scrollToSection={scrollToSection}
                        handleReset={handleReset}
                        onRetry={() => startGeneration()}
                        hasPlan={!!generatedPlan}
                    />

                    {/* ── Right Content (Markdown) ── */}
                    <div
                        className="w-full bg-[#FAFAF7] border border-[#E8E4E0] p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 shadow-[var(--shadow-float)] min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] relative group"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        {generatedPlan ? (
                            <>
                                {/* ── Actions Bar ── */}
                                <div
                                    className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-1 sm:gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-[var(--duration-fast)] bg-[#FAFAF7] p-1 sm:p-1.5 border border-[#E8E4E0] shadow-sm z-10"
                                    style={{ borderRadius: 'var(--radius)' }}
                                >
                                    <button
                                        onClick={handleCopy}
                                        className="p-1.5 sm:p-2 text-[#6E6E7A] hover:text-[#0C0C1D] hover:bg-[#F0EDE8] transition-colors rounded-md group/btn relative"
                                        title="Copy plan"
                                    >
                                        {isCopied ? (
                                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6B8F71]" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        )}
                                        <span className="hidden lg:block absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-[#0C0C1D] text-[#FAFAF7] text-[9px] font-black uppercase tracking-wider rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap pointer-events-none transition-all duration-200 ease-out translate-y-1 group-hover/btn:translate-y-0 z-50 shadow-xl">
                                            Copy
                                        </span>
                                    </button>
                                    <div className="w-px h-5 sm:h-6 bg-[#E8E4E0] my-auto mx-0.5 sm:mx-1" />
                                    <button
                                        onClick={() => handleDownload('md')}
                                        className="p-1.5 sm:p-2 text-[#6E6E7A] hover:text-[#0C0C1D] hover:bg-[#F0EDE8] transition-colors rounded-md flex items-center gap-1"
                                        title="Download plan (.md)"
                                    >
                                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider">
                                            .md
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => handleDownload('txt')}
                                        className="p-1.5 sm:p-2 text-[#6E6E7A] hover:text-[#0C0C1D] hover:bg-[#F0EDE8] transition-colors rounded-md flex items-center gap-1"
                                        title="Download plan (.txt)"
                                    >
                                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider">
                                            .txt
                                        </span>
                                    </button>
                                </div>
                                <MarkdownRenderer content={generatedPlan} />
                            </>
                        ) : (
                            <div className="flex flex-col gap-8 w-full">
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-[40%]" />
                                    <SkeletonText lines={4} />
                                </div>
                                <div className="space-y-4">
                                    <Skeleton className="h-8 w-[30%]" />
                                    <SkeletonText lines={6} />
                                </div>
                                <div className="space-y-4">
                                    <Skeleton className="h-8 w-[35%]" />
                                    <SkeletonText lines={5} />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px] z-10">
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#0C0C1D] bg-white px-6 py-3 border border-[#E8E4E0] shadow-sm">
                                        {isGenerating ? 'Waiting for data...' : 'No plan generated yet.'}
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}
