"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Ambulance, ShieldCheck, Siren, Clock, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export type AssignmentStatus = 'PENDING' | 'VALIDATED' | 'REJECTED'

interface AmbulanceCardProps {
    plateNumber: string
    category: 'MARK' | 'VDF'
    leaderName?: string
    teammateName?: string
    status?: AssignmentStatus
    startTime?: string
    endTime?: string
    onClick?: () => void
    isCompact?: boolean
}

export function AmbulanceCard({
    plateNumber,
    category,
    leaderName,
    teammateName,
    status = 'PENDING',
    startTime,
    endTime,
    onClick,
    isCompact = false
}: AmbulanceCardProps) {
    const isFull = !!(leaderName && teammateName)
    const isEmpty = !leaderName && !teammateName

    const statusColors = {
        PENDING: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
        VALIDATED: "bg-green-500/20 text-green-600 border-green-500/30",
        REJECTED: "bg-red-500/20 text-red-600 border-red-500/30"
    }

    const categoryStyles = {
        MARK: "border-orange-500/40 bg-orange-50/50 dark:bg-orange-950/20",
        VDF: "border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20"
    }

    return (
        <Card
            onClick={onClick}
            className={cn(
                "relative overflow-hidden transition-all duration-300 group cursor-pointer border-2 hover:shadow-xl hover:-translate-y-1",
                categoryStyles[category],
                isEmpty && "opacity-80 grayscale-[0.5] hover:opacity-100 hover:grayscale-0",
                !isCompact && "min-w-[280px]"
            )}
        >
            {/* Background Icon Decoration */}
            <Ambulance className={cn(
                "absolute -right-4 -bottom-4 w-32 h-32 opacity-5 transition-transform duration-500 group-hover:scale-110",
                category === 'MARK' ? "text-orange-600" : "text-blue-600"
            )} />

            <CardContent className={cn("p-4", isCompact ? "p-3" : "p-4")}>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <div className={cn(
                                "p-2 rounded-lg shadow-inner",
                                category === 'MARK' ? "bg-orange-500 text-white" : "bg-blue-600 text-white"
                            )}>
                                <Ambulance size={isCompact ? 16 : 20} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                                {category} Unit
                            </span>
                        </div>
                        <h3 className="text-xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">
                            {plateNumber}
                        </h3>
                    </div>

                    {startTime && (
                        <Badge variant="outline" className="flex items-center gap-1.5 font-bold bg-white/50 backdrop-blur-sm border-slate-200">
                            <Clock size={12} className="text-primary" />
                            {startTime} - {endTime || '??'}
                        </Badge>
                    )}
                </div>

                <div className="space-y-3 relative z-10">
                    {/* Responsable Row */}
                    <div className={cn(
                        "flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200",
                        leaderName
                            ? "bg-white/80 dark:bg-slate-900/80 border-slate-200 shadow-sm"
                            : "bg-slate-100/50 border-dashed border-slate-300 text-slate-400 italic"
                    )}>
                        <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full border-2",
                            leaderName ? "bg-orange-100 border-orange-200 text-orange-600" : "bg-slate-200 border-slate-300"
                        )}>
                            <ShieldCheck size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] uppercase font-bold opacity-50 leading-none mb-1">Responsable</span>
                            <span className="text-sm font-bold truncate">
                                {leaderName || "En attente..."}
                            </span>
                        </div>
                    </div>

                    {/* Co-équipier Row */}
                    <div className={cn(
                        "flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200",
                        teammateName
                            ? "bg-white/80 dark:bg-slate-900/80 border-slate-200 shadow-sm"
                            : "bg-slate-100/50 border-dashed border-slate-300 text-slate-400 italic"
                    )}>
                        <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full border-2",
                            teammateName ? "bg-blue-100 border-blue-200 text-blue-600" : "bg-slate-200 border-slate-300"
                        )}>
                            <User size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] uppercase font-bold opacity-50 leading-none mb-1">Co-équipier</span>
                            <span className="text-sm font-bold truncate">
                                {teammateName || "En attente..."}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Status */}
                {!isEmpty && (
                    <div className="mt-4 pt-3 border-t border-slate-200/50 flex justify-between items-center">
                        <Badge className={cn("px-2 py-0 text-[10px] font-black uppercase tracking-widest", statusColors[status])}>
                            {status === 'PENDING' && "En attente"}
                            {status === 'VALIDATED' && "Validé ✅"}
                            {status === 'REJECTED' && "Refusé ❌"}
                        </Badge>

                        {status === 'VALIDATED' && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                                <UserCheck size={12} /> Prêt pour le service
                            </div>
                        )}
                    </div>
                )}
            </CardContent>

            {/* Glowing Accent for Active Units */}
            {isFull && status === 'PENDING' && (
                <div className="absolute top-0 right-0 p-1">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                </div>
            )}
        </Card>
    )
}
