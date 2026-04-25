import { Loader2 } from "lucide-react"

export default function Loading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6 animate-pulse">
            <div className="flex flex-col gap-6">
                {/* Header Skeleton */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-muted rounded-xl size-12"></div>
                            <div className="h-8 w-40 bg-muted rounded-md"></div>
                        </div>
                        <div className="h-4 w-64 bg-muted rounded mt-2"></div>
                    </div>
                    <div className="h-12 w-32 bg-muted rounded-xl"></div>
                </div>

                {/* Filter Buttons Skeleton */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="h-10 w-32 bg-muted rounded-xl"></div>
                    <div className="h-10 w-32 bg-muted rounded-xl"></div>
                    <div className="h-10 w-32 bg-muted rounded-xl"></div>
                    <div className="h-10 w-32 bg-muted rounded-xl"></div>
                    <div className="w-px h-6 bg-border mx-1"></div>
                    <div className="h-10 w-32 bg-muted rounded-xl"></div>
                    <div className="h-10 w-32 bg-muted rounded-xl"></div>
                </div>

                {/* Table/Cards Skeleton */}
                <div className="border border-border rounded-xl p-6 bg-card flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="h-10 w-64 bg-muted rounded-md"></div>
                        <div className="h-10 w-32 bg-muted rounded-md"></div>
                    </div>
                    
                    <div className="space-y-3 mt-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 w-full bg-muted/50 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
