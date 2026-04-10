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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, ShieldCheck, User, PenLine, Save, X, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { overrideHistoryAssignment } from "@/actions/regulation.actions"
import { toast } from "sonner"

interface HistoryDetailsDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    assignment: any
    personnel?: any[]
    globalAssignedIds?: Set<string>
    onSuccess?: () => void
}

export function HistoryDetailsDialog({ isOpen, onOpenChange, assignment, personnel = [], globalAssignedIds = new Set(), onSuccess }: HistoryDetailsDialogProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [newLeaderId, setNewLeaderId] = useState(assignment?.leaderId || "")
    const [newTeammateId, setNewTeammateId] = useState(assignment?.teammateId || "")
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (isOpen && assignment) {
            setIsEditing(false)
            setNewLeaderId(assignment.leaderId || "")
            setNewTeammateId(assignment.teammateId || "")
        }
    }, [isOpen, assignment])

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

    const handleSave = async () => {
        if (!newLeaderId) {
            toast.error("Veuillez sélectionner au moins un Chef de bord !");
            return;
        }

        setIsSaving(true);
        try {
            const res = await overrideHistoryAssignment({
                assignmentId: assignment.id,
                newLeaderId,
                newTeammateId: newTeammateId || null
            });
            if (res.error) throw new Error(res.error);
            
            toast.success("Équipage modifié et validé avec succès (Remplacement d'urgence).");
            if (onSuccess) onSuccess();
        } catch (e: any) {
            toast.error(e.message || "Erreur lors de la modification");
        } finally {
            setIsSaving(false);
        }
    }

    // Filtrer les disponibles
    const availablePersonnel = personnel.filter(p => !globalAssignedIds.has(p.id) || p.id === assignment.leaderId || p.id === assignment.teammateId);

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
                    <DialogDescription asChild>
                        <div className="flex items-center justify-between mt-2">
                            <div className="text-sm font-medium pt-2">
                                Historique du <strong className="text-slate-800 dark:text-slate-200">{format(new Date(assignment.date), 'EEEE d MMMM yyyy', { locale: fr })}</strong>
                            </div>
                            {!isEditing && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setIsEditing(true)}
                                    className="gap-2 border-orange-200 text-orange-600 hover:bg-orange-50 font-bold"
                                >
                                    <PenLine size={14} />
                                    Modifier
                                </Button>
                            )}
                        </div>
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
                            {assignment.isRegulatorForced && (
                                <div className="text-[10px] mt-1 uppercase text-green-800 opacity-80">(Validé par un régulateur)</div>
                            )}
                        </div>
                    </div>

                    {/* Horaires */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100">
                            <Clock size={18} className="text-slate-500" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Heure de prise de service</div>
                            <div className="font-bold text-base">{assignment.startTime}</div>
                        </div>
                    </div>

                    {/* Equipage */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400">Composition d'Équipage</h4>
                        
                        {/* Leader */}
                        <div className="flex items-center gap-4 p-3 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm relative">
                            <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-500 rounded-xl shrink-0">
                                <ShieldCheck size={20} />
                            </div>
                            <div className="flex flex-col w-full min-w-0">
                                <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Responsable / Chef de bord</div>
                                {isEditing ? (
                                    <Select value={newLeaderId || undefined} onValueChange={setNewLeaderId}>
                                        <SelectTrigger className="w-full mt-1 border-2 focus:ring-0">
                                            <SelectValue placeholder="Sélectionner..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availablePersonnel.map((p) => (
                                                <SelectItem key={p.id} value={p.id} className="font-bold cursor-pointer">
                                                    {p.lastName} {p.firstName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <>
                                        <div className="font-bold text-base truncate">{leaderName.trim() || 'Non assigné'}</div>
                                        {assignment.leaderValidatedAt && (
                                            <div className="text-[10px] font-black text-green-600 italic mt-0.5">Validé à {format(new Date(assignment.leaderValidatedAt), 'HH:mm')}</div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Teammate */}
                        <div className="flex items-center gap-4 p-3 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm relative">
                            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 rounded-xl shrink-0">
                                <User size={20} />
                            </div>
                            <div className="flex flex-col w-full min-w-0">
                                <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Co-équipier</div>
                                {isEditing ? (
                                    <div className="flex gap-2 w-full mt-1">
                                        <Select value={newTeammateId || undefined} onValueChange={setNewTeammateId}>
                                            <SelectTrigger className="w-full border-2 focus:ring-0">
                                                <SelectValue placeholder="Personne (Equipage Solo)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="" className="text-slate-400 italic font-medium cursor-pointer">Aucun co-équipier</SelectItem>
                                                {availablePersonnel.map((p) => (
                                                    <SelectItem key={p.id} value={p.id} className="font-bold cursor-pointer" disabled={p.id === newLeaderId}>
                                                        {p.lastName} {p.firstName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {newTeammateId && (
                                            <Button variant="ghost" size="icon" className="shrink-0 text-slate-400 hover:text-red-500" onClick={() => setNewTeammateId("")}>
                                                <X size={16} />
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="font-bold text-base truncate">{teammateName.trim() || 'Non assigné'}</div>
                                        {assignment.teammateValidatedAt && (
                                            <div className="text-[10px] font-black text-green-600 italic mt-0.5">Validé à {format(new Date(assignment.teammateValidatedAt), 'HH:mm')}</div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            <Button variant="outline" className="flex-1 font-bold h-11" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                Annuler
                            </Button>
                            <Button 
                                className="flex-1 font-bold gap-2 h-11 bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20" 
                                onClick={handleSave} 
                                disabled={isSaving || !newLeaderId}
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                Valider
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
