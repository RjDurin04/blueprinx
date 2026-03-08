'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword as betterAuthReset } from '@/lib/auth-client';
import Link from 'next/link';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token.');
        }
    }, [token]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!token) {
            setError('Invalid or missing reset token.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            setLoading(false);
            return;
        }

        try {
            const { error: updateError } = await betterAuthReset({
                newPassword: password,
                token
            });

            if (updateError) {
                setError(updateError.message || 'Failed to reset password.');
                return;
            }

            setSuccess(true);
            // Redirect after short delay
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-[calc(100dvh-12rem)] flex items-center justify-center px-4 animate-fadeSlideIn">
            <div className="w-full max-w-[420px]">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-px bg-[#C8956C]" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C8956C]">
                        New Password
                    </span>
                </div>

                <h1 className="text-[clamp(1.5rem,4vw,2.5rem)] font-light tracking-[-0.03em] leading-[1.1] text-[#0C0C1D] mb-4">
                    Set your new<br />
                    <span className="italic font-normal">password.</span>
                </h1>

                {success ? (
                    <div className="p-4 text-[12px] text-[#6B8F71] bg-[#6B8F71]/[0.05] border border-[#6B8F71]/20" style={{ borderRadius: 'var(--radius)' }}>
                        Password updated successfully! Redirecting...
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="mb-4 p-3 text-[12px] text-[#D94F4F] bg-[#D94F4F]/[0.05] border border-[#D94F4F]/20" style={{ borderRadius: 'var(--radius)' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#A0A0A8] mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 text-[14px] text-[#0C0C1D] bg-[#FAFAF7] border border-[#E8E4E0] focus:border-[#C8956C] focus:outline-none transition-colors"
                                    style={{ borderRadius: 'var(--radius)' }}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#A0A0A8] mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 text-[14px] text-[#0C0C1D] bg-[#FAFAF7] border border-[#E8E4E0] focus:border-[#C8956C] focus:outline-none transition-colors"
                                    style={{ borderRadius: 'var(--radius)' }}
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !password.trim() || !confirmPassword.trim()}
                                className="w-full py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] bg-[#0C0C1D] text-[#FAFAF7] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#C8956C] transition-all duration-[var(--duration-normal)]"
                                style={{ borderRadius: 'var(--radius)' }}
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </>
                )}

                <div className="mt-6 text-center">
                    <Link
                        href="/"
                        className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#A0A0A8] hover:text-[#C8956C] transition-colors"
                    >
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="w-full min-h-[calc(100dvh-12rem)] flex items-center justify-center">
                <div className="text-[#A0A0A8] text-[12px] font-medium uppercase tracking-[0.15em] flex items-center gap-2">
                    Loading reset form...
                </div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
