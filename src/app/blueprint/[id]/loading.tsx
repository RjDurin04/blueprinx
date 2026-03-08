export default function BlueprintLoading() {
    return (
        <div className="min-h-dvh bg-[#FAFAF7]">
            <div className="w-full mx-auto flex flex-col items-center px-3 sm:px-6 md:px-8 max-w-[1200px]">
                <div className="w-full flex flex-col lg:grid lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] gap-4 sm:gap-6 lg:gap-8 xl:gap-12 mt-4 sm:mt-6 lg:mt-8 mb-16 sm:mb-24 lg:mb-32 items-start">
                    {/* Sidebar Skeleton */}
                    <div
                        className="w-full flex flex-col gap-3 sm:gap-4 p-3 sm:p-5 md:p-6 border border-[#E8E4E0] bg-[#FAFAF7] shadow-[var(--shadow-float)]"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        <div className="flex items-center gap-2 mb-1 pb-3 border-b border-[#E8E4E0]">
                            <div className="w-2 h-2 rounded-full bg-[#E8E4E0] animate-pulse" />
                            <div className="w-20 h-2.5 bg-[#E8E4E0] animate-pulse rounded" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-2.5 bg-[#E8E4E0] animate-pulse rounded w-full" />
                            <div className="h-2.5 bg-[#E8E4E0] animate-pulse rounded w-3/4" />
                        </div>
                        <div className="w-full h-9 bg-[#E8E4E0] animate-pulse mt-2" style={{ borderRadius: 'var(--radius)' }} />
                    </div>

                    {/* Content Skeleton */}
                    <div
                        className="w-full bg-[#FAFAF7] border border-[#E8E4E0] p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 shadow-[var(--shadow-float)] min-h-[500px]"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        <div className="space-y-4 animate-pulse pt-4">
                            <div className="h-6 bg-[#E8E4E0] rounded w-2/3" />
                            <div className="h-4 bg-[#E8E4E0] rounded w-full" />
                            <div className="h-4 bg-[#E8E4E0] rounded w-5/6" />
                            <div className="h-4 bg-[#E8E4E0] rounded w-4/5" />
                            <div className="h-px bg-[#E8E4E0] my-6" />
                            <div className="h-5 bg-[#E8E4E0] rounded w-1/2" />
                            <div className="h-4 bg-[#E8E4E0] rounded w-full" />
                            <div className="h-4 bg-[#E8E4E0] rounded w-3/4" />
                            <div className="h-4 bg-[#E8E4E0] rounded w-5/6" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
