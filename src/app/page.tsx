'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useArchitectStore } from '@/stores/architect-store';
import { authClient } from '@/lib/auth-client';

export default function Home() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const { prompt, setPrompt, isGenerating, startGeneration } = useArchitectStore();

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating || isNavigating) return;

    // Check auth on demand rather than on mount
    const { data: session } = await authClient.getSession();

    // Auth gate: redirect to login if not authenticated
    if (!session?.user) {
      router.push('/login?redirect=/');
      return;
    }

    setIsNavigating(true);
    // Await the API call so the plan row exists in DB before navigating
    await startGeneration();
    router.push('/dashboard');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const MAX_PROMPT_LENGTH = 5000;

  return (
    <div className="w-full min-h-[calc(100dvh-12rem)] flex flex-col items-center justify-center px-4 sm:px-8 md:px-12 lg:px-16 animate-fadeSlideIn">
      <div className="w-full max-w-[1240px] grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-24 items-center">

        {/* ── Left Column: Messaging & Artifact Ticker ── */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-8 h-px bg-[#C8956C]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C8956C]">
              Blueprinx v1.0
            </span>
          </div>

          <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-light tracking-[-0.05em] leading-[0.95] text-[#0C0C1D] mb-6 lg:mb-10">
            Turn your idea<br />
            <span className="italic font-normal">into a plan.</span>
          </h1>

          <p className="text-[15px] sm:text-[17px] leading-[1.6] text-[#6E6E7A] max-w-[440px] mb-12 lg:mb-16 font-medium">
            Create a clear plan for your next app. We&apos;ll handle the technical details so you can start building faster.
          </p>

          {/* ── Artifact Ticker (Non-Linear Graphics) ── */}
          <div className="hidden lg:flex flex-wrap gap-2 max-w-[500px] opacity-40">
            {['Business Rules', 'User States', 'System Events', 'App Modules', 'Workflows', 'Edge Cases'].map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#0C0C1D] border border-[#E8E4E0] px-3 py-1.5 bg-white/50 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right Column: Control Surface (Input) ── */}
        <div className="w-full relative group">
          <div
            className="absolute -inset-4 bg-[#C8956C]/[0.03] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--duration-slow)] pointer-events-none"
          />

          <div
            className="relative flex flex-col bg-[#FAFAF7] border border-[#E8E4E0] overflow-hidden transition-all duration-[var(--duration-slow)] ease-[var(--ease-out-expo)] group-hover:shadow-[var(--shadow-elevated)] group-hover:-translate-y-1"
            style={{ borderRadius: 'var(--radius)' }}
          >
            {/* ── Control Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EDE8] bg-white/50">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#E8E4E0]" />
                <div className="w-2 h-2 rounded-full bg-[#E8E4E0]" />
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#A0A0A8]">
                App Details
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              maxLength={MAX_PROMPT_LENGTH}
              placeholder="Describe what you want to build in plain English. For example: a food delivery app, a fitness tracker, or a store for digital goods."
              className="w-full min-h-[160px] sm:min-h-[220px] max-h-[400px] resize-none bg-transparent px-6 sm:px-8 py-6 sm:py-8 text-[15px] sm:text-[16px] leading-[1.75] text-[#0C0C1D] placeholder:text-[#C0BCB6] focus:outline-none font-normal"
              disabled={isGenerating}
            />

            <div className="flex flex-col sm:flex-row justify-between items-center px-6 sm:px-8 py-5 sm:py-6 border-t border-[#F0EDE8] bg-white/50 gap-4">
              <div className="flex items-center gap-3">
                <div className="px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#A0A0A8] border border-[#E8E4E0] bg-white shadow-sm">
                  ⌘ Enter
                </div>
                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#C0BCB6]">
                  to start
                </span>
                {prompt.length > 0 && (
                  <span className={`text-[9px] font-medium uppercase tracking-[0.1em] ${prompt.length > MAX_PROMPT_LENGTH * 0.9 ? 'text-[#D94F4F]' : 'text-[#C0BCB6]'}`}>
                    {prompt.length}/{MAX_PROMPT_LENGTH}
                  </span>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating || isNavigating}
                className="text-[10px] font-semibold uppercase tracking-[0.2em] bg-[#0C0C1D] text-[#FAFAF7] px-10 py-4 border border-[#0C0C1D] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#C8956C] hover:border-[#C8956C] transition-all duration-[var(--duration-normal)] ease-[var(--ease-out-expo)] w-full sm:w-auto flex items-center justify-center gap-3 shadow-lg hover:shadow-[#C8956C]/20"
              >
                {(isGenerating || isNavigating) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {isNavigating ? 'Planning...' : 'Create Plan'}
              </button>
            </div>
          </div>

          {/* ── Desktop Decorative Label ── */}
          <div className="absolute top-1/2 -right-8 translate-x-full -translate-y-1/2 hidden xl:block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.5em] text-[#E8E4E0] vertical-text transform rotate-180" style={{ writingMode: 'vertical-rl' }}>
              Workspace 01
            </span>
          </div>
        </div>
      </div>

      {/* ── Mobile/Tablet Ticker (Bottom) ── */}
      <div className="mt-16 lg:hidden flex flex-wrap justify-center gap-2 opacity-40">
        {['Rules', 'States', 'Events', 'Modules'].map((tag) => (
          <span
            key={tag}
            className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#0C0C1D] border border-[#E8E4E0] px-2 py-1 bg-[#FAFAF7]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Icons ──
function Loader2({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
