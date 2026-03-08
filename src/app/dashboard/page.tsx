'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Plus, Trash2, FileText, Loader2, RefreshCcw, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useArchitectStore } from '@/stores/architect-store';
import type { Plan } from '@/types/plan';

export default function DashboardPage() {
    const router = useRouter();
    const { deletePlan, reset, startGeneration } = useArchitectStore();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

    useEffect(() => {
        // Prefetch common navigation targets for instant transitions
        router.prefetch('/');
    }, [router]);

    // SWR handles fetching, polling, deduplication, and race-conditions flawlessly.
    const hasGenerating = plans.some((p) => p.status === 'generating');
    useSWR(
        'dashboard-plans',
        () => useArchitectStore.getState().loadPlans(),
        {
            refreshInterval: hasGenerating ? 30000 : 0,
            revalidateOnFocus: true,
            dedupingInterval: 2000,
            onSuccess: (data) => {
                setPlans(data);
                setLoading(false);
            },
            onError: () => {
                setLoading(false);
            }
        }
    );

    const handleDeleteRequest = (e: React.MouseEvent, plan: Plan) => {
        e.stopPropagation();
        setPlanToDelete(plan);
    };

    const confirmDelete = async () => {
        if (!planToDelete) return;

        const planId = planToDelete.id;
        setDeletingId(planId);

        const success = await deletePlan(planId);
        if (success) {
            setPlans((prev) => prev.filter((p) => p.id !== planId));
            setPlanToDelete(null);
        }
        setDeletingId(null);
    };

    const handleNewPlan = () => {
        reset();
        router.push('/');
    };

    const handleRetry = async (e: React.MouseEvent, plan: Plan) => {
        e.stopPropagation();
        reset();
        useArchitectStore.setState({ prompt: plan.prompt, savedPlanId: plan.id });
        startGeneration(plan.id);
        router.push(`/blueprint/${plan.id}`);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <>
            <div className="w-full mx-auto flex flex-col items-center px-4 sm:px-8 md:px-12 transition-all duration-700 max-w-[900px] animate-fadeSlideIn">
                {/* Header */}
                <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 sm:mt-6 md:mt-8 mb-8 sm:mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-px bg-[#C8956C]" />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C8956C]">
                                Dashboard
                            </span>
                        </div>
                        <h1 className="text-[clamp(1.5rem,4vw,2.5rem)] font-light tracking-[-0.03em] text-[#0C0C1D]">
                            My Plans
                        </h1>
                    </div>

                    <button
                        onClick={handleNewPlan}
                        className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] bg-[#0C0C1D] text-[#FAFAF7] px-6 py-3 hover:bg-[#C8956C] transition-all duration-[var(--duration-normal)] shadow-lg"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        <Plus className="w-4 h-4" />
                        New Plan
                    </button>
                </div>

                {/* Plans List */}
                {loading ? (
                    <div className="w-full flex flex-col gap-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="w-full h-24 bg-[#F0EDEA] animate-pulse border border-[#E8E4E0]"
                                style={{ borderRadius: 'var(--radius)', animationDelay: `${i * 100}ms` }}
                            />
                        ))}
                    </div>
                ) : plans.length === 0 ? (
                    <div className="w-full flex flex-col items-center justify-center py-24 text-center">
                        <FileText className="w-12 h-12 text-[#E8E4E0] mb-4" />
                        <p className="text-[14px] text-[#6E6E7A] mb-2">No plans yet.</p>
                        <p className="text-[12px] text-[#A0A0A8] mb-6">
                            Create your first architectural plan to get started.
                        </p>
                        <button
                            onClick={handleNewPlan}
                            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C8956C] border border-[#C8956C] px-6 py-3 hover:bg-[#C8956C] hover:text-[#FAFAF7] transition-all duration-[var(--duration-normal)]"
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            Create First Plan
                        </button>
                    </div>
                ) : (
                    <div className="w-full flex flex-col gap-3 mb-16">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`group w-full flex items-center justify-between p-4 sm:p-5 bg-[#FAFAF7] border hover:shadow-[var(--shadow-float)] transition-all duration-[var(--duration-normal)] cursor-pointer
                                ${(plan.status === 'failed' || plan.status === 'error') ? 'border-[#D94F4F]/40 bg-[#D94F4F]/5' : 'border-[#E8E4E0] hover:border-[#C8956C]/40'}
                            `}
                                style={{ borderRadius: 'var(--radius)' }}
                                onClick={() => {
                                    if (plan.status === 'completed') router.push(`/blueprint/${plan.id}`);
                                    else if (plan.status === 'failed' || plan.status === 'error') {/* Wait for retry click */ }
                                    else if (plan.status === 'generating') router.push(`/blueprint/${plan.id}`);
                                }}
                            >
                                <div className="flex-1 min-w-0 mr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-[14px] sm:text-[15px] font-semibold text-[#0C0C1D] truncate group-hover:text-[#C8956C] transition-colors">
                                            {plan.title}
                                        </h3>
                                        {plan.status === 'generating' && (
                                            <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#C8956C] bg-[#C8956C]/10 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Generating
                                            </span>
                                        )}
                                        {(plan.status === 'failed' || plan.status === 'error') && (
                                            <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#D94F4F] bg-[#D94F4F]/10 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                                <AlertTriangle className="w-2.5 h-2.5" /> {plan.status === 'error' ? 'Error' : 'Interrupted'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] sm:text-[12px] text-[#A0A0A8] truncate">
                                        {plan.prompt.slice(0, 100)}
                                        {plan.prompt.length > 100 ? '...' : ''}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
                                    {(plan.status === 'failed' || plan.status === 'error') && (
                                        <button
                                            onClick={(e) => handleRetry(e, plan)}
                                            className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-[#FAFAF7] bg-[#0C0C1D] px-2.5 py-1.5 sm:px-3 hover:bg-[#C8956C] transition-colors min-h-[36px] sm:min-h-[auto]"
                                            style={{ borderRadius: 'var(--radius)' }}
                                        >
                                            <RefreshCcw className="w-3 h-3" />
                                            <span className="hidden sm:inline">Retry</span>
                                        </button>
                                    )}
                                    <span className="text-[8px] sm:text-[9px] font-medium uppercase tracking-[0.1em] text-[#A0A0A8] hidden xs:block">
                                        {formatDate(plan.created_at)}
                                    </span>
                                    <button
                                        onClick={(e) => handleDeleteRequest(e, plan)}
                                        disabled={deletingId === plan.id}
                                        className="p-2 min-h-[44px] min-w-[44px] sm:min-h-[auto] sm:min-w-[auto] flex items-center justify-center text-[#A0A0A8] hover:text-[#D94F4F] transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                        title="Delete plan"
                                    >
                                        {deletingId === plan.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {planToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPlanToDelete(null)}
                            className="absolute inset-0 bg-[#0C0C1D]/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-[#FAFAF7] p-6 sm:p-8 shadow-2xl border border-[#E8E4E0]"
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            <button
                                onClick={() => setPlanToDelete(null)}
                                disabled={deletingId === planToDelete.id}
                                className="absolute top-4 right-4 p-2 text-[#A0A0A8] hover:text-[#0C0C1D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-[#D94F4F]/10 rounded-full flex items-center justify-center mb-6">
                                    <Trash2 className="w-6 h-6 text-[#D94F4F]" />
                                </div>
                                <h3 className="text-[18px] font-semibold text-[#0C0C1D] mb-2">Delete Plan?</h3>
                                <p className="text-[14px] text-[#6E6E7A] mb-8">
                                    Are you sure you want to delete <span className="font-medium text-[#0C0C1D]">&quot;{planToDelete.title}&quot;</span>? This action cannot be undone.
                                </p>

                                <div className="w-full flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => setPlanToDelete(null)}
                                        disabled={deletingId === planToDelete.id}
                                        className="flex-1 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6E6E7A] border border-[#E8E4E0] hover:bg-[#F0EDEA] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ borderRadius: 'var(--radius)' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={deletingId === planToDelete.id}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] bg-[#D94F4F] text-[#FAFAF7] hover:bg-[#C13D3D] transition-all shadow-lg disabled:opacity-75 disabled:cursor-not-allowed"
                                        style={{ borderRadius: 'var(--radius)' }}
                                    >
                                        {deletingId === planToDelete.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            'Delete Forever'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
