'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleResend = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);

        try {
            const { error: resendError } = await authClient.sendVerificationEmail({
                email,
                callbackURL: '/'
            });

            if (resendError) {
                setError(resendError.message || 'Failed to send verification email.');
                return;
            }

            setMessage('Verification email sent! Please check your inbox.');
            setEmail('');
        } catch {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-[calc(100dvh-12rem)] flex flex-col items-center justify-center px-4 animate-fadeSlideIn">
            <div className="w-full max-w-[420px] bg-[#FAFAF7] border border-[#E8E4E0] p-8 sm:p-10" style={{ borderRadius: 'var(--radius)' }}>
                <div className="w-12 h-12 bg-white border border-[#E8E4E0] flex items-center justify-center mb-6 shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
                    <Mail className="w-5 h-5 text-[#0C0C1D]" />
                </div>

                <h1 className="text-[24px] font-light tracking-[-0.03em] leading-[1.2] text-[#0C0C1D] mb-3">
                    Check your email
                </h1>

                <p className="text-[14px] leading-[1.6] text-[#6E6E7A] mb-8">
                    We&apos;ve sent a verification link to your email address. Please click the link to verify your account and start using Blueprinx.
                </p>

                <div className="h-px w-full bg-[#E8E4E0] mb-8" />

                <div className="mb-4">
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#0C0C1D] mb-2">
                        Didn&apos;t receive it?
                    </h2>
                    <p className="text-[13px] text-[#A0A0A8] mb-4">
                        Check your spam folder, or enter your email below to request a new link.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 text-[12px] text-[#D94F4F] bg-[#D94F4F]/[0.05] border border-[#D94F4F]/20" style={{ borderRadius: 'var(--radius)' }}>
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-4 p-3 text-[12px] text-[#6B8F71] bg-[#6B8F71]/[0.05] border border-[#6B8F71]/20" style={{ borderRadius: 'var(--radius)' }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleResend} className="flex flex-col gap-3">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="w-full px-4 py-3 text-[14px] text-[#0C0C1D] bg-white border border-[#E8E4E0] focus:border-[#C8956C] focus:outline-none transition-colors"
                        style={{ borderRadius: 'var(--radius)' }}
                    />
                    <button
                        type="submit"
                        disabled={loading || !email.trim()}
                        className="w-full py-3 text-[10px] font-semibold uppercase tracking-[0.2em] bg-[#0C0C1D] text-[#FAFAF7] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#C8956C] transition-all duration-[var(--duration-normal)] flex items-center justify-center gap-2"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resend Link'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.15em] text-[#A0A0A8] hover:text-[#C8956C] transition-colors"
                    >
                        Return to login <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
