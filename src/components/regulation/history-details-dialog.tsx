"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { format, isBefore, setHours, setMinutes, setSeconds, setMilliseconds, subDays } from "date-fns"
import { fr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Clock, ShieldCheck, User } from "lucide-react"

interface HistoryDetailsDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    assignment: any
}

export function HistoryDetailsDialog({ isOpen, onOpenChange, assignment }: HistoryDetailsDialogProps) {
    if (!assignment) return null;

    const leaderName = `${assignment.leader?.lastName || ''} ${assignment.leader?.firstName || ''}`;
    const teammateName = `${assignment.teammate?.lastName || ''} ${assignment.teammate?.firstName || ''}`;

    const getStatusText = (status: string, dateStr: string) => {
        if (status === 'VALIDATED') return "Mission validée collectivement"
        if (status === 'REJECTED') return "Mission refusée / Signalement"

        if (status === 'PENDING') {
            const now = new Date();
            const assignmentDate = new Date(dateStr);
            const dDay = subDays(assignmentDate, 1);
            
            const threshold19h = setMilliseconds(setSeconds(setMinutes(setHours(dDay, 19), 0), 0), 0);
            const threshold21h = setMilliseconds(setSeconds(setMinutes(setHours(dDay, 21), 0), 0), 0);

            if (isBefore(now, threshold19h)) {
                return "Composition en cours (Envoi prévu à 19h)";
            } else if (now >= threshold19h && isBefore(now, threshold21h)) {
                return "En attente de validation (avant 21h)";
            } else {
                return "Équipage n'a pas validé avant 21h (Oubli)";
            }
        }
        return status
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span className="text-xl font-bold flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-md text-xs text-white ${assignment.vehicle?.category === 'MARK' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                                {assignment.vehicle?.category || 'N/A'}
                            </span>
                            {assignment.vehicle?.plateNumber}
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-sm font-medium pt-2">
                        Historique du <strong className="text-slate-800 dark:text-slate-200">{format(new Date(assignment.date), 'EEEE d MMMM yyyy', { locale: fr })}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4 pb-2">
                    {/* Status Badge */}
                    <div className="flex justify-center">
                        <div className={`px-4 py-2 rounded-xl font-bold text-sm w-full text-center border-2 ${
                            assignment.status === 'VALIDATED' ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' :
                            assignment.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm' :
                            'bg-red-50 text-red-600 border-red-200 shadow-sm'
                        }`}>
                            {getStatusText(assignment.status, assignment.date)}
                        </div>
                    </div>

                    {/* Horaires */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100">
                            <Clock size={18} className="text-slate-500" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Horaires de service</div>
                            <div className="font-bold text-base">{assignment.startTime} <span className="text-slate-400 font-normal mx-1">à</span> {assignment.endTime}</div>
                        </div>
                    </div>

                    {/* Equipage */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400">Composition d'Équipage</h4>
                        
                        {/* Leader */}
                        <div className="flex items-center gap-4 p-3 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                            <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-500 rounded-xl">
                                <ShieldCheck size={20} />
                            </div>
                            <div className="flex flex-col">
                                <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Responsable / Chef de bord</div>
                                <div className="font-bold text-base">{leaderName.trim() || 'Non assigné'}</div>
                            </div>
                        </div>

                        {/* Teammate */}
                        <div className="flex items-center gap-4 p-3 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 rounded-xl">
                                <User size={20} />
                            </div>
                            <div className="flex flex-col">
                                <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Co-équipier</div>
                                <div className="font-bold text-base">{teammateName.trim() || 'Non assigné'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
