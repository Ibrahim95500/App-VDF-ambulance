import { EuroIcon } from "lucide-react"

export default function Loading() {
    return (
        <div className="flex flex-col gap-5 lg:gap-7.5 max-w-5xl mx-auto w-full px-4 sm:px-0 animate-pulse">
            <div className="flex items-center gap-3 mb-2">
                <div className="size-8 rounded-full bg-secondary/20" />
                <div className="h-8 w-48 bg-secondary/20 rounded-md" />
            </div>

            <div className="flex flex-col gap-3">
                <div className="h-16 w-full bg-orange-50/50 rounded-lg border border-orange-100" />
                <div className="h-16 w-full bg-blue-50/50 rounded-lg border border-blue-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5 mt-2">
                <div className="lg:col-span-1">
                    <div className="flex flex-col rounded-xl border border-border h-64 bg-muted/20">
                        <div className="px-5 py-4 border-b border-border">
                            <div className="h-5 w-3/4 bg-border/50 rounded" />
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="h-10 w-full bg-border/30 rounded-md" />
                            <div className="h-10 w-full bg-border/30 rounded-md" />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="flex flex-col rounded-xl border border-border h-64 bg-muted/20">
                        <div className="px-5 py-4 border-b border-border">
                            <div className="h-5 w-1/3 bg-border/50 rounded" />
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="h-12 w-full bg-border/30 rounded-md" />
                            <div className="h-12 w-full bg-border/30 rounded-md" />
                            <div className="h-12 w-full bg-border/30 rounded-md" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
