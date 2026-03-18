"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Ambulance, ShieldCheck, Clock, CheckCircle2, Clock3, XCircle, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type AssignmentStatus = 'PENDING' | 'VALIDATED' | 'REJECTED'

interface AmbulanceCardProps {
    plateNumber: string
    category: 'MARK' | 'VDF'
    leaderName?: string
    teammateName?: string
    leaderDiploma?: string
    teammateDiploma?: string
    leaderIsRegulateur?: boolean
    teammateIsRegulateur?: boolean
    leaderValidated?: boolean
    teammateValidated?: boolean
    status?: AssignmentStatus
    startTime?: string
    endTime?: string
    assignmentId?: string
    onDelete?: (id: string, e: React.MouseEvent) => void
    onClick?: () => void
    isCompact?: boolean
}

export function AmbulanceCard({
    plateNumber,
    category,
    leaderName,
    teammateName,
    leaderDiploma,
    teammateDiploma,
    leaderIsRegulateur = false,
    teammateIsRegulateur = false,
    leaderValidated = false,
    teammateValidated = false,
    status = 'PENDING',
    startTime,
    assignmentId,
    onDelete,
    onClick,
    isCompact = false
}: AmbulanceCardProps) {
    const isFull = !!(leaderName && teammateName)
    const isEmpty = !leaderName && !teammateName

    // Compteur de validation par véhicule
    const validatedCount = (leaderValidated ? 1 : 0) + (teammateValidated ? 1 : 0)
    const totalCount = isFull ? 2 : leaderName || teammateName ? 1 : 0

    // Statut global du véhicule basé sur les validations individuelles
    const vehicleStatus: 'none' | 'partial' | 'full' = isFull
        ? validatedCount === 2 ? 'full' : validatedCount === 1 ? 'partial' : 'none'
        : 'none'

    const categoryStyles = {
        MARK: "border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20",
        VDF: "border-orange-500/40 bg-orange-50/50 dark:bg-orange-950/20"
    }

    const PersonRow = ({
        name,
        isLeader,
        validated,
        diploma,
        isRegulateur
    }: { name?: string; isLeader: boolean; validated: boolean; diploma?: string; isRegulateur?: boolean }) => (
        <div className={cn(
            "flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200",
            name
                ? "bg-white/80 dark:bg-slate-900/80 border-slate-200 shadow-sm"
                : "bg-slate-100/50 border-dashed border-slate-300 text-slate-400 italic"
        )}>
            <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2",
                name && isLeader ? "bg-orange-100 border-orange-200 text-orange-600" :
                name && !isLeader ? "bg-blue-100 border-blue-200 text-blue-600" :
                "bg-slate-200 border-slate-300"
            )}>
                {isLeader ? <ShieldCheck size={16} /> : <User size={16} />}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[9px] uppercase font-bold opacity-50 leading-none mb-1">
                    {isLeader ? "Responsable" : "Co-équipier"}
                </span>
                <span className="text-sm font-bold truncate flex items-center gap-2">
                    {name || "En attente..."}
                    {isRegulateur && (
                        <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-600 border-purple-200 uppercase px-1 h-4 shrink-0">Regul</Badge>
                    )}
                </span>
            </div>
            {/* Badge validation individuelle */}
            {name && (
                validated ? (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 shrink-0">
                        <CheckCircle2 size={11} />
                        <span>Validé</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">
                        <Clock3 size={11} />
                        <span>En attente</span>
                    </div>
                )
            )}
        </div>
    )

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
                category === 'MARK' ? "text-blue-600" : "text-orange-600"
            )} />

            <CardContent className={cn("relative z-10", isCompact ? "p-3" : "p-4")}>
                {/* Header : plaque + heure */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <div className={cn(
                                "p-2 rounded-lg shadow-inner",
                                category === 'MARK' ? "bg-blue-600 text-white" : "bg-orange-500 text-white"
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

                    <div className="flex flex-col items-end gap-2">
                        {startTime && (
                            <Badge variant="outline" className="flex items-center gap-1.5 font-bold bg-white/50 backdrop-blur-sm border-slate-200">
                                <Clock size={12} className="text-primary" />
                                {startTime}
                            </Badge>
                        )}
                        {assignmentId && onDelete && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(assignmentId, e); }}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Effacer l'équipage"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Équipage */}
                <div className="space-y-2 mb-3">
                    <PersonRow name={leaderName} isLeader={true} validated={leaderValidated} diploma={leaderDiploma} isRegulateur={leaderIsRegulateur} />
                    <PersonRow name={teammateName} isLeader={false} validated={teammateValidated} diploma={teammateDiploma} isRegulateur={teammateIsRegulateur} />
                </div>

                {/* Footer : statut global du véhicule + compteur */}
                {isFull && (
                    <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between items-center">
                        {vehicleStatus === 'full' && (
                            <div className="flex items-center gap-1.5 text-[11px] font-black text-green-700 bg-green-100 border border-green-300 rounded-full px-3 py-1">
                                <CheckCircle2 size={13} />
                                Validé ✅
                            </div>
                        )}
                        {vehicleStatus === 'partial' && (
                            <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-700 bg-amber-100 border border-amber-300 rounded-full px-3 py-1">
                                <Clock3 size={13} />
                                Partiellement validé
                            </div>
                        )}
                        {vehicleStatus === 'none' && (
                            <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 bg-slate-100 border border-slate-300 rounded-full px-3 py-1">
                                <Clock3 size={13} />
                                En attente
                            </div>
                        )}

                        {/* Compteur par véhicule */}
                        <div className={cn(
                            "text-[11px] font-black rounded-full px-2.5 py-1 border",
                            vehicleStatus === 'full' ? "bg-green-100 text-green-700 border-green-300" :
                            vehicleStatus === 'partial' ? "bg-amber-100 text-amber-700 border-amber-300" :
                            "bg-slate-100 text-slate-500 border-slate-300"
                        )}>
                            {validatedCount}/{totalCount} validé{validatedCount !== 1 ? "s" : ""}
                        </div>
                    </div>
                )}

                {/* Indicateur pulsant si en attente de validation */}
                {isFull && vehicleStatus !== 'full' && (
                    <div className="absolute top-3 right-3">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
