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
    statusLog: string[];
    isGenerating: boolean;
    error: string | null;
    tableOfContents: ToCItem[];
    scrollToSection: (text: string) => void;
    handleReset: () => void;
    onRetry: () => void;
    hasPlan: boolean;
}

export const BlueprintSidebar = React.memo(function BlueprintSidebar({
    statusLog,
    isGenerating,
    error,
    tableOfContents,
    scrollToSection,
    handleReset,
    onRetry,
    hasPlan
}: BlueprintSidebarProps) {
    const [isNavigating, setIsNavigating] = React.useState(false);
    const router = useRouter();

    return (
        <div
            className="w-full lg:sticky lg:top-8 flex flex-col gap-3 sm:gap-4 p-3 sm:p-5 md:p-6 border border-[#E8E4E0] bg-[#FAFAF7] shadow-[var(--shadow-float)] lg:max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide will-change-scroll"
            style={{ borderRadius: 'var(--radius)' }}
        >
            <div className="flex items-center gap-2 mb-0.5 sm:mb-1 pb-2 sm:pb-3 border-b border-[#E8E4E0]">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#0C0C1D]" />
                <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-[#0C0C1D]">
                    My Progress
                </h3>
            </div>

            <div className="flex flex-col gap-2 sm:gap-2.5">
                {statusLog.map((log, i) => {
                    const isLast = i === statusLog.length - 1;
                    return (
                        <div
                            key={`${i}-${log}`}
                            className="flex items-start gap-2 sm:gap-3 animate-fadeSlideIn"
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            <div
                                className={`mt-1 w-1.5 h-1.5 shrink-0 rounded-full ${isLast && isGenerating ? 'bg-[#C8956C] animate-pulse' : 'bg-[#6B8F71]'
                                    }`}
                            />
                            <span
                                className={`text-[9px] sm:text-[10px] leading-[1.6] font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] ${isLast && isGenerating ? 'text-[#C8956C]' : 'text-[#6E6E7A]'
                                    }`}
                            >
                                {log}
                            </span>
                        </div>
                    );
                })}
            </div>

            {isGenerating && (
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[#F0EDE8] flex items-center gap-2.5 text-[#C8956C]">
                    <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em]">
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
                        className="w-full py-2 sm:py-2.5 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-[#FAFAF7] bg-[#0C0C1D] hover:bg-[#C8956C] transition-all duration-[var(--duration-normal)] ease-[var(--ease-out-expo)] text-center flex items-center justify-center gap-2"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Retry Now
                    </button>
                </div>
            )}

            {/* ── Navigation buttons ── */}
            <div className="flex flex-col gap-1.5 sm:gap-2 mt-2 sm:mt-4">
                <Link
                    href="/progress"
                    className="w-full py-2 sm:py-2.5 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-[#0C0C1D] border border-[#E8E4E0] hover:border-[#C8956C] hover:text-[#C8956C] transition-all duration-[var(--duration-normal)] ease-[var(--ease-out-expo)] bg-white text-center inline-flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Back
                </Link>

                {!isGenerating && hasPlan && (
                    <button
                        onClick={async () => {
                            setIsNavigating(true);
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            handleReset();
                            router.push('/');
                        }}
                        disabled={isNavigating}
                        className="w-full py-2 sm:py-2.5 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-[#0C0C1D] border border-[#E8E4E0] hover:border-[#C8956C] hover:text-[#C8956C] transition-all duration-[var(--duration-normal)] ease-[var(--ease-out-expo)] bg-white text-center flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isNavigating && <Loader2 className="w-3 h-3 animate-spin" />}
                        {isNavigating ? 'Clearing...' : 'New Plan'}
                    </button>
                )}
            </div>

            {/* ── Table of Contents ── */}
            {tableOfContents.length > 0 && (
                <div className="hidden lg:flex flex-col gap-2 sm:gap-2.5 mt-3 sm:mt-5 pt-3 sm:pt-5 border-t border-[#E8E4E0] w-full min-h-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                        <AlignLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0C0C1D]" />
                        <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-[#0C0C1D]">
                            Sections
                        </h3>
                    </div>
                    <div className="flex flex-col gap-1 sm:gap-1.5 overflow-y-auto scrollbar-hide pr-2 flex-1 min-h-0">
                        {tableOfContents.map((item, idx) => (
                            <button
                                key={`${idx}-${item.text}`}
                                onClick={() => scrollToSection(item.text)}
                                className={`text-left leading-[1.4] transition-colors hover:text-[#C8956C] ${item.level === 1 ? 'text-[11px] font-black uppercase tracking-wider text-[#0C0C1D] mb-1' :
                                    item.level === 2 ? 'text-[10px] font-bold text-[#6E6E7A]' :
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
