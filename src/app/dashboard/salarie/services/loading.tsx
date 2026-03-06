import { LifeBuoy } from "lucide-react"

export default function Loading() {
    return (
        <div className="flex flex-col gap-5 lg:gap-7.5 max-w-5xl mx-auto w-full px-4 sm:px-0 animate-pulse">
            <div className="flex items-center gap-3 mb-2">
                <div className="size-8 rounded-full bg-secondary/20" />
                <div className="h-8 w-56 bg-secondary/20 rounded-md" />
            </div>

            <div className="flex flex-col rounded-xl border border-border h-[400px] bg-muted/20">
                <div className="px-5 py-4 border-b border-border">
                    <div className="h-5 w-1/4 bg-border/50 rounded" />
                </div>
                <div className="p-5 space-y-3">
                    <div className="flex gap-4">
                        <div className="h-12 w-full bg-border/30 rounded-md" />
                        <div className="h-12 w-full bg-border/30 rounded-md" />
                    </div>
                    <div className="h-16 w-full bg-border/30 rounded-md" />
                    <div className="h-16 w-full bg-border/30 rounded-md" />
                    <div className="h-16 w-full bg-border/30 rounded-md" />
                </div>
            </div>
        </div>
    )
}
