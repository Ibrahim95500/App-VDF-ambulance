"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { User, ShieldCheck, Clock, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { saveAssignment } from "@/actions/regulation.actions"
import { toast } from "sonner"

interface Personnel {
    id: string
    firstName: string | null
    lastName: string | null
    diploma: string | null
    isTeamLeader: boolean
    structure: 'MARK' | 'VDF' | 'LES_2' | null
    oubliCount: number
}

interface AssignmentDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    vehicleId: string
    plateNumber: string
    category: 'MARK' | 'VDF'
    date: Date
    dateStr: string
    personnel: Personnel[]
    vehicles?: any[]
    onSuccess: () => void
    initialData?: {
        leaderId?: string
        teammateId?: string
        startTime?: string
        endTime?: string
    }
}

export function AssignmentDialog({
    isOpen,
    onOpenChange,
    vehicleId,
    plateNumber,
    category,
    date,
    dateStr,
    personnel,
    vehicles = [],
    onSuccess,
    initialData
}: AssignmentDialogProps) {
    const [loading, setLoading] = useState(false)
    const [leaderId, setLeaderId] = useState(initialData?.leaderId || "")
    const [teammateId, setTeammateId] = useState(initialData?.teammateId || "")
    const [startTime, setStartTime] = useState(initialData?.startTime || "07:00")
    const [endTime, setEndTime] = useState(initialData?.endTime || "19:00")

    useEffect(() => {
        if (isOpen) {
            setLeaderId(initialData?.leaderId || "")
            setTeammateId(initialData?.teammateId || "")
            setStartTime(initialData?.startTime || "07:00")
            setEndTime(initialData?.endTime || "19:00")
        }
    }, [isOpen, initialData])

    // On récupère tous les IDs des personnes déjà assignées sur d'AUTRES véhicules À CETTE DATE uniquement.
    // Chaque date est indépendante : être assigné le 11/03 ne bloque pas le 12/03.
    const assignedIds = new Set<string>();
    vehicles.forEach(v => {
        if (v.id !== vehicleId && v.assignments && v.assignments.length > 0) {
            const assignment = v.assignments[0];
            if (assignment.leaderId) assignedIds.add(assignment.leaderId);
            if (assignment.teammateId) assignedIds.add(assignment.teammateId);
        }
    });

    /**
     * Compatibilité structure ↔ type de véhicule :
     *   MARK unit → MARK, LES_2, ou null (polyvalent)
     *   VDF unit  → VDF,  LES_2, ou null (polyvalent)
     * Ainsi un profil LES_2 ou sans structure définie peut aller partout.
     */
    const isCompatible = (pStructure: string | null | undefined, vehicleCategory: 'MARK' | 'VDF'): boolean => {
        if (!pStructure || pStructure === 'LES_2') return true;  // polyvalent
        return pStructure === vehicleCategory;
    };

    // Personnel libre ce jour-là (pas déjà affecté sur un autre véhicule aujourd'hui)
    const freePersonnel = personnel.filter(p => !assignedIds.has(p.id));

    // Responsables : isTeamLeader = true ET structure compatible avec le véhicule
    const availableLeaders = freePersonnel.filter(p =>
        p.isTeamLeader === true && isCompatible(p.structure, category)
    );

    // Co-équipiers : structure compatible (aucune contrainte sur isTeamLeader)
    const availableTeammates = freePersonnel.filter(p =>
        isCompatible(p.structure, category)
    );

    const isSamePerson = leaderId !== "" && teammateId !== "" && leaderId === teammateId;

    const handleSave = async () => {
        if (!leaderId || !teammateId) {
            toast.error("Veuillez sélectionner un équipage complet.")
            return
        }

        if (isSamePerson) {
            toast.error("Le responsable et le co-équipier doivent être différents.")
            return
        }

        try {
            setLoading(true)
            const result = await saveAssignment({
                vehicleId,
                leaderId,
                teammateId,
                dateStr,
                startTime,
                endTime
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Assignation enregistrée !")
                onSuccess()
                onOpenChange(false)
            }
        } catch (error: any) {
            toast.error("Erreur lors de l'enregistrement")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg text-white ${category === 'MARK' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                Planification {plateNumber}
                                <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${category === 'MARK' ? 'bg-blue-600' : 'bg-orange-500'}`}>{category}</span>
                            </DialogTitle>
                            <DialogDescription>
                                Affectation pour le {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Horaires */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Prise de service</Label>
                        <Input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="font-bold"
                        />
                    </div>

                    {/* Responsable */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60 flex items-center gap-2">
                            <ShieldCheck size={14} className="text-orange-500" /> Responsable (DEA/Titulaire)
                        </Label>
                        <Select value={leaderId} onValueChange={setLeaderId}>
                            <SelectTrigger className="font-medium h-12">
                                <SelectValue placeholder="Choisir un responsable" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableLeaders
                                    .map(p => (
                                        <SelectItem key={p.id} value={p.id} className="py-3">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold">{p.lastName} {p.firstName}</span>
                                                    {p.diploma === 'REGULATEUR' && (
                                                        <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-600 border-purple-200 uppercase px-1 h-4">Regul</Badge>
                                                    )}
                                                    {p.oubliCount > 0 && (
                                                        <Badge variant="destructive" className="text-[8px] h-3.5 px-1 font-black leading-none flex items-center gap-0.5">
                                                            <AlertCircle size={8} /> {p.oubliCount}/3
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-[10px] opacity-60 uppercase">{p.diploma || "DEA"} {p.isTeamLeader && "⭐ Chef"}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Co-équipier */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60 flex items-center gap-2">
                            <User size={14} className="text-blue-500" /> Co-équipier (Auxiliaire/Stagiaire)
                        </Label>
                        <Select value={teammateId} onValueChange={setTeammateId}>
                            <SelectTrigger className="font-medium h-12">
                                <SelectValue placeholder="Choisir un co-équipier" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTeammates
                                    .filter(p => p.id !== leaderId) // Dynamique : On retire celui choisi en responsable
                                    .map(p => (
                                        <SelectItem key={p.id} value={p.id} className="py-3">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold">{p.lastName} {p.firstName}</span>
                                                    {p.oubliCount > 0 && (
                                                        <Badge variant="destructive" className="text-[8px] h-3.5 px-1 font-black leading-none flex items-center gap-0.5">
                                                            <AlertCircle size={8} /> {p.oubliCount}/3
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-[10px] opacity-60 uppercase">{p.diploma || "Auxiliaire"}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {isSamePerson && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold flex items-center gap-2 border border-red-200 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={18} />
                        Action impossible : Responsable et Co-équipier identiques.
                    </div>
                )}

                <DialogFooter className="flex gap-3 sm:gap-3 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12 text-base font-bold rounded-xl">
                        ✕ Annuler
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || isSamePerson}
                        className="flex-1 h-12 text-base bg-[#FF4500] hover:bg-[#CC3700] text-white font-bold rounded-xl"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={18} className="mr-2" />}
                        Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
