'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export function AuthHeaderButtons() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
        router.refresh();
    };

    if (loading) {
        return (
            <div className="flex items-center gap-3">
                <div className="w-16 h-3 bg-[#E8E4E0] animate-pulse" style={{ borderRadius: 'var(--radius)' }} />
            </div>
        );
    }

    if (!user) {
        // Hide sign in button if already on login page
        if (pathname === '/login') return null;

        return (
            <div className="flex items-center gap-3 sm:gap-4">
                <Link
                    href="/login"
                    className="min-h-[44px] flex items-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-[#0C0C1D] hover:text-[#C8956C] transition-colors duration-[var(--duration-normal)]"
                >
                    Sign In
                </Link>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <Link
                href="/dashboard"
                className="min-h-[44px] flex items-center text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-[#A0A0A8] hover:text-[#0C0C1D] transition-colors duration-[var(--duration-normal)]"
            >
                My Plans
            </Link>
            <div className="w-px h-4 bg-[#E8E4E0]" />
            <span className="hidden md:block text-[9px] font-bold text-[#6E6E7A] max-w-[120px] truncate">
                {user.email}
            </span>
            <button
                onClick={handleSignOut}
                className="min-h-[44px] flex items-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-[#A0A0A8] hover:text-[#D94F4F] transition-colors duration-[var(--duration-normal)]"
            >
                Sign Out
            </button>
        </div>
    );
}
