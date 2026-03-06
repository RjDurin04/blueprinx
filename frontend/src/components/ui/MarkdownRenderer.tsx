'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
}

// Stable component references — defined OUTSIDE the render function
// to prevent React from creating new component instances on every render.
// This is critical for performance during streaming.
const H1 = ({ node, ...props }: any) => (
    <h1
        className="text-[clamp(1.75rem,3vw,2.5rem)] font-light tracking-[-0.03em] leading-[1.15] mt-12 mb-6 text-[#0C0C1D] first:mt-0"
        {...props}
    />
);

const H2 = ({ node, ...props }: any) => (
    <h2
        className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C8956C] mt-16 mb-6 pb-3 border-b border-[#E8E4E0] first:mt-0"
        {...props}
    />
);

const H3 = ({ node, ...props }: any) => (
    <h3
        className="text-[16px] font-semibold tracking-[-0.01em] mt-10 mb-3 text-[#0C0C1D]"
        {...props}
    />
);

const H4 = ({ node, ...props }: any) => (
    <h4
        className="text-[14px] font-semibold tracking-normal mt-8 mb-2 text-[#2A2A2E]"
        {...props}
    />
);

const P = ({ node, ...props }: any) => (
    <p
        className="text-[14px] leading-[1.8] text-[#4A4A56] [&:not(:first-child)]:mt-4"
        {...props}
    />
);

const UL = ({ node, ...props }: any) => (
    <ul className="my-4 ml-5 space-y-1.5 list-none" {...props} />
);

const OL = ({ node, ...props }: any) => (
    <ol
        className="my-4 ml-5 space-y-1.5 list-decimal marker:text-[#C8956C] marker:font-bold"
        {...props}
    />
);

const LI = ({ node, ...props }: any) => (
    <li
        className="text-[14px] leading-[1.8] text-[#4A4A56] pl-1 relative before:content-[''] before:absolute before:left-[-14px] before:top-[11px] before:w-[4px] before:h-[4px] before:bg-[#C8956C] before:rounded-full"
        {...props}
    />
);

const Blockquote = ({ node, ...props }: any) => (
    <blockquote
        className="mt-6 border-l-2 border-[#C8956C]/40 pl-6 py-1 text-[14px] text-[#6E6E7A] italic bg-[#C8956C]/[0.02]"
        style={{ borderRadius: '0 var(--radius) var(--radius) 0' }}
        {...props}
    />
);

const Code = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
        <div
            className="relative my-6 overflow-hidden border border-[#E8E4E0]"
            style={{ borderRadius: 'var(--radius)' }}
        >
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#E8E4E0] bg-[#F5F3F0]">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#A0A0A8]">
                    {match[1]}
                </span>
            </div>
            <pre className="p-4 overflow-x-auto bg-[#FAFAF7] -webkit-overflow-scrolling-touch">
                <code
                    className="text-[13px] leading-[1.7] font-[family-name:var(--font-jetbrains)] text-[#0C0C1D]"
                    {...props}
                >
                    {children}
                </code>
            </pre>
        </div>
    ) : (
        <code
            className="text-[13px] font-[family-name:var(--font-jetbrains)] text-[#845A34] bg-[#C8956C]/[0.08] px-1.5 py-0.5 border border-[#C8956C]/10"
            {...props}
        >
            {children}
        </code>
    );
};

const Table = ({ node, ...props }: any) => (
    <div
        className="my-8 w-full overflow-x-auto border border-[#E8E4E0]"
        style={{ borderRadius: 'var(--radius)' }}
    >
        <table className="w-full text-[13px]" {...props} />
    </div>
);

const Thead = ({ node, ...props }: any) => (
    <thead className="bg-[#F5F3F0]" {...props} />
);

const Th = ({ node, ...props }: any) => (
    <th
        className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-[0.15em] text-[#6E6E7A] border-b border-[#E8E4E0]"
        {...props}
    />
);

const Td = ({ node, ...props }: any) => (
    <td
        className="px-4 py-2.5 text-[13px] text-[#4A4A56] border-b border-[#F0EDE8] last:border-0"
        {...props}
    />
);

const Anchor = ({ node, ...props }: any) => (
    <a
        className="text-[#C8956C] underline underline-offset-2 decoration-[#C8956C]/30 hover:decoration-[#C8956C] transition-colors duration-[var(--duration-normal)]"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
    />
);

const Hr = ({ node, ...props }: any) => (
    <hr className="my-12 border-0 h-px bg-[#E8E4E0]" {...props} />
);

const Strong = ({ node, ...props }: any) => (
    <strong className="font-semibold text-[#0C0C1D]" {...props} />
);

// Stable components object — never recreated between renders
const COMPONENTS = {
    h1: H1,
    h2: H2,
    h3: H3,
    h4: H4,
    p: P,
    ul: UL,
    ol: OL,
    li: LI,
    blockquote: Blockquote,
    code: Code,
    table: Table,
    thead: Thead,
    th: Th,
    td: Td,
    a: Anchor,
    hr: Hr,
    strong: Strong,
};

// Stable plugins array — never recreated between renders
const REMARK_PLUGINS = [remarkGfm];

function MarkdownRendererInner({ content }: MarkdownRendererProps) {
    return (
        <div className="max-w-none w-full markdown-content">
            <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={COMPONENTS}>
                {content}
            </ReactMarkdown>
        </div>
    );
}

// React.memo prevents re-render unless `content` actually changes.
// Combined with the batched store updates (~60fps), this means the markdown
// is only re-parsed at most once per animation frame instead of per-chunk.
export const MarkdownRenderer = React.memo(MarkdownRendererInner);
