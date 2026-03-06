'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse bg-[#F0EDEA] border border-[#E8E4E0]/50',
                className
            )}
            style={{ borderRadius: 'var(--radius)' }}
        />
    );
}

export function SkeletonText({ className, lines = 3 }: { className?: string; lines?: number }) {
    return (
        <div className={cn('flex flex-col gap-2 w-full', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        'h-3 w-full',
                        i === lines - 1 && 'w-[60%]'
                    )}
                />
            ))}
        </div>
    );
}
