export default function DashboardLoading() {
    return (
        <div className="w-full mx-auto flex flex-col items-center px-4 sm:px-8 md:px-12 transition-all duration-700 max-w-[900px] animate-fadeSlideIn">
            {/* Header Skeleton */}
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 sm:mt-6 md:mt-8 mb-8 sm:mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-px bg-[#E8E4E0]" />
                        <div className="w-16 h-2.5 bg-[#E8E4E0] animate-pulse" style={{ borderRadius: 'var(--radius)' }} />
                    </div>
                    <div className="w-32 h-8 bg-[#E8E4E0] animate-pulse" style={{ borderRadius: 'var(--radius)' }} />
                </div>
                <div className="w-28 h-10 bg-[#E8E4E0] animate-pulse" style={{ borderRadius: 'var(--radius)' }} />
            </div>

            {/* Plan List Skeleton */}
            <div className="w-full flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="w-full h-[76px] bg-[#F0EDEA] animate-pulse border border-[#E8E4E0]"
                        style={{ borderRadius: 'var(--radius)', animationDelay: `${i * 100}ms` }}
                    />
                ))}
            </div>
        </div>
    );
}
