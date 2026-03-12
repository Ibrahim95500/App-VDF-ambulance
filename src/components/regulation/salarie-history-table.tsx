"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CheckCircle2, XCircle, Clock, Ambulance } from "lucide-react"
import { cn } from "@/lib/utils"

interface SalarieHistoryTableProps {
    data: any[]
    userId: string
}

export function SalarieHistoryTable({ data, userId }: SalarieHistoryTableProps) {
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 text-center px-6">
                <p className="text-slate-500 font-medium">Aucun historique de mission trouvé.</p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-bottom border-slate-100 dark:border-slate-800">
                            <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider">Date</th>
                            <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider">Véhicule</th>
                            <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider">Status Équipage</th>
                            <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider">Ma Validation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.map((item) => {
                            const isLeader = item.leaderId === userId
                            const myValidation = isLeader ? item.leaderValidated : item.teammateValidated
                            
                            // Let's improve the display based on common status
                            return (
                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                {format(new Date(item.date), "dd MMM yyyy", { locale: fr })}
                                            </span>
                                            <span className="text-[10px] text-slate-400 capitalize">
                                                {format(new Date(item.date), "EEEE", { locale: fr })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "p-1.5 rounded-lg",
                                                item.vehicle.category === 'MARK' ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                                            )}>
                                                <Ambulance size={14} />
                                            </div>
                                            <span className="text-sm font-black tracking-tighter">{item.vehicle.plateNumber}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase",
                                            item.status === 'VALIDATED' ? "bg-green-100 text-green-700 border border-green-200" :
                                            item.status === 'PENDING' ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                            "bg-red-100 text-red-700 border border-red-200"
                                        )}>
                                            {item.status === 'VALIDATED' ? 'Complet' : item.status === 'PENDING' ? 'En attente' : 'Refusé'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {myValidation ? (
                                                <div className="flex items-center gap-1 text-green-600 font-bold text-xs">
                                                    <CheckCircle2 size={14} />
                                                    <span>Validé</span>
                                                </div>
                                            ) : (() => {
                                                // Logique d'Oubli : seulement après 21h la veille de la mission
                                                const missionDate = new Date(item.date)
                                                const deadline = new Date(missionDate)
                                                deadline.setDate(deadline.getDate() - 1)
                                                deadline.setHours(21, 0, 0, 0)

                                                const now = new Date()
                                                const isDeadlinePassed = now > deadline

                                                if (isDeadlinePassed) {
                                                    return (
                                                        <div className="flex items-center gap-1 text-red-500 font-bold text-xs">
                                                            <XCircle size={14} />
                                                            <span>Oubli</span>
                                                        </div>
                                                    )
                                                } else {
                                                    return (
                                                        <div className="flex items-center gap-1 text-slate-400 font-bold text-xs italic">
                                                            <Clock size={14} />
                                                            <span>En attente...</span>
                                                        </div>
                                                    )
                                                }
                                            })()}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
