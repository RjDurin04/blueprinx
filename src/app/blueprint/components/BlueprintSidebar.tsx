'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlignLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ToCItem {
    level: number;
    text: string;
}

interface BlueprintSidebarProps {
    prompt: string;
    isGenerating: boolean;
    error: string | null;
    tableOfContents: ToCItem[];
    scrollToSection: (text: string) => void;
    handleReset: () => void;
    onRetry: () => void;
    hasPlan: boolean;
}

export const BlueprintSidebar = React.memo(function BlueprintSidebar({
    prompt,
    isGenerating,
    error,
    tableOfContents,
    scrollToSection,
    handleReset,
    onRetry,
    hasPlan
}: BlueprintSidebarProps) {
    const router = useRouter();

    return (
        <div
            className="w-full lg:sticky lg:top-8 flex flex-col gap-3 sm:gap-4 p-3 sm:p-5 md:p-6 border border-[#E8E4E0] bg-[#FAFAF7] shadow-[var(--shadow-float)] lg:max-h-[calc(100dvh-4rem)]"
            style={{ borderRadius: 'var(--radius)' }}
        >
            <div className="flex items-center gap-2 mb-0.5 sm:mb-1 pb-2 sm:pb-3 border-b border-[#E8E4E0]">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#0C0C1D]" />
                <h3 className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.2em] text-[#0C0C1D]">
                    Saved Plan
                </h3>
            </div>

            <p className="text-[10px] sm:text-[11px] text-[#6E6E7A] leading-[1.6] mb-1">
                {prompt.slice(0, 150)}{prompt.length > 150 ? '...' : ''}
            </p>

            {isGenerating && (
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[#F0EDE8] flex items-center gap-2.5 text-[#C8956C]">
                    <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                    <span className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.15em]">
                        Processing...
                    </span>
                </div>
            )}

            {error && (
                <div className="flex flex-col gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[#F0EDE8]">
                    <div className="text-[9px] sm:text-[10px] text-[#D94F4F]">
                        {error}
                    </div>
                    <button
                        onClick={onRetry}
                        className="w-full py-2 sm:py-2.5 text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.2em] text-[#FAFAF7] bg-[#0C0C1D] hover:bg-[#C8956C] transition-all duration-[var(--duration-normal)] ease-[var(--ease-out-expo)] text-center flex items-center justify-center gap-2"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Retry Now
                    </button>
                </div>
            )}

            {/* ── Navigation buttons ── */}
            <div className="flex flex-col gap-1.5 sm:gap-2 mt-2 sm:mt-4 shrink-0">
                <Link
                    href="/dashboard"
                    className="w-full py-2 sm:py-2.5 text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.2em] text-[#0C0C1D] border border-[#E8E4E0] hover:border-[#C8956C] hover:text-[#C8956C] transition-all duration-[var(--duration-normal)] ease-[var(--ease-out-expo)] bg-white text-center inline-flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Dashboard
                </Link>

                {!isGenerating && hasPlan && (
                    <button
                        onClick={() => {
                            handleReset();
                            router.push('/');
                        }}
                        className="w-full py-2 sm:py-2.5 text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.2em] text-[#0C0C1D] border border-[#E8E4E0] hover:border-[#C8956C] hover:text-[#C8956C] transition-all duration-[var(--duration-normal)] ease-[var(--ease-out-expo)] bg-white text-center flex items-center justify-center gap-2"
                    >
                        New Plan
                    </button>
                )}
            </div>

            {/* ── Table of Contents ── */}
            {!isGenerating && tableOfContents.length > 0 && (
                <div className="hidden lg:flex flex-col gap-2 sm:gap-2.5 mt-3 sm:mt-5 pt-3 sm:pt-5 border-t border-[#E8E4E0] w-full min-h-0 flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-0.5 sm:mb-1 shrink-0">
                        <AlignLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0C0C1D]" />
                        <h3 className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.2em] text-[#0C0C1D]">
                            Sections
                        </h3>
                    </div>
                    <div className="flex flex-col gap-1 sm:gap-1.5 overflow-y-auto scrollbar-hide pr-2 flex-1 min-h-0">
                        {tableOfContents.map((item, idx) => (
                            <button
                                key={`${idx}-${item.text}`}
                                onClick={() => scrollToSection(item.text)}
                                className={`text-left leading-[1.4] transition-colors hover:text-[#C8956C] ${item.level === 1 ? 'text-[11px] font-semibold uppercase tracking-wider text-[#0C0C1D] mb-1' :
                                    item.level === 2 ? 'text-[10px] font-medium text-[#6E6E7A]' :
                                        item.level === 3 ? 'pl-3 text-[10px] font-medium text-[#A0A0A8]' :
                                            'pl-5 text-[10px] font-normal text-[#B0B0B8]'
                                    }`}
                            >
                                {item.text}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});
