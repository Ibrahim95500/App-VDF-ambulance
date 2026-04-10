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
import { Combobox } from "@/components/ui/combobox"
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
    globalAssignedIds: Set<string>
    onSuccess: () => void
    defaultTime?: string
    initialData?: {
        id?: string
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
    globalAssignedIds,
    onSuccess,
    defaultTime,
    initialData
}: AssignmentDialogProps) {
    const [loading, setLoading] = useState(false)
    const [leaderId, setLeaderId] = useState(initialData?.leaderId || "")
    const [teammateId, setTeammateId] = useState(initialData?.teammateId || "")
    const [startTime, setStartTime] = useState(initialData?.startTime || defaultTime || "07:00")
    const [endTime, setEndTime] = useState(initialData?.endTime || "19:00")
    const [serverError, setServerError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            setLeaderId(initialData?.leaderId || "")
            setTeammateId(initialData?.teammateId || "")
            setStartTime(initialData?.startTime || defaultTime || "07:00")
            setEndTime(initialData?.endTime || "19:00")
            setServerError(null)
        }
    }, [isOpen, initialData])

    // On utilise les IDs globaux (Jour + Nuit + Dispo + Regulateur)
    const assignedIds = new Set(globalAssignedIds);
    // On retire les personnes déjà assignées sur ce véhicule spécifique pour pouvoir les modifier
    if (initialData?.leaderId) assignedIds.delete(initialData.leaderId);
    if (initialData?.teammateId) assignedIds.delete(initialData.teammateId);


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

    // Personnel libre ce jour-là (pas déjà affecté sur un autre véhicule aujourd'hui), 
    // ou bien la personne DEJA affectée sur ce véhicule (pour qu'elle s'affiche correctement !)
    const freePersonnel = personnel.filter(p => !assignedIds.has(p.id) || p.id === initialData?.leaderId || p.id === initialData?.teammateId);

    const isVSL = plateNumber.toUpperCase().includes('VSL')

    // Responsables : isTeamLeader = true ET structure compatible avec le véhicule (Sauf pour VSL : tout le monde peut l'être)
    // On force aussi l'inclusion si c'est LE leader de cette réservation, pour corriger le bug dropdown vide
    const availableLeaders = freePersonnel.filter(p =>
        p.id === initialData?.leaderId || ((isVSL || p.isTeamLeader === true) && isCompatible(p.structure, category))
    );

    // Co-équipiers : Tout le monde, avec structure compatible, et on force la cible actuelle
    const availableTeammates = freePersonnel.filter(p =>
        p.id === initialData?.teammateId || isCompatible(p.structure, category)
    );

    const isSamePerson = leaderId !== "" && teammateId !== "" && leaderId === teammateId;

    const handleSave = async () => {
        if (!leaderId || (!isVSL && !teammateId)) {
            toast.error(isVSL ? "Veuillez sélectionner un conducteur." : "Veuillez sélectionner un équipage complet.")
            return
        }

        if (isSamePerson) {
            toast.error("Le responsable et le co-équipier doivent être différents.")
            return
        }

        try {
            setLoading(true)
            const result = await saveAssignment({
                planningId: initialData?.id,
                vehicleId,
                leaderId,
                teammateId,
                dateStr,
                startTime,
                endTime
            })
            setServerError(null)

            if (result.error) {
                setServerError(result.error)
                toast.error("Veuillez corriger l'erreur affichée ci-dessous.")
            } else {
                toast.success("Assignation enregistrée !")
                onSuccess()
                onOpenChange(false)
            }
        } catch (error: any) {
            console.error("UI Dialog Error:", error);
            toast.error(`Erreur critique: ${error.message || error}`)
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
                        <Combobox
                            options={availableLeaders.map(p => ({
                                value: p.id,
                                label: `${p.lastName} ${p.firstName}`,
                                description: `${p.diploma || "DEA"} ${p.isTeamLeader ? "⭐ Chef" : ""}`
                            }))}
                            value={leaderId}
                            onValueChange={setLeaderId}
                            placeholder="Choisir un responsable"
                            searchPlaceholder="Rechercher par nom..."
                            className="h-12 border-2"
                        />
                    </div>

                    {/* Co-équipier */}
                    {!isVSL && (
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase opacity-60 flex items-center gap-2">
                                <User size={14} className="text-blue-500" /> Co-équipier (Auxiliaire/Stagiaire)
                            </Label>
                            <Combobox
                                options={availableTeammates.filter(p => p.id !== leaderId).map(p => ({
                                    value: p.id,
                                    label: `${p.lastName} ${p.firstName}`,
                                    description: `${p.diploma || "Auxiliaire"} ${p.isTeamLeader ? "⭐ Chef" : ""}`
                                }))}
                                value={teammateId}
                                onValueChange={setTeammateId}
                                placeholder="Choisir un co-équipier"
                                searchPlaceholder="Rechercher par nom..."
                                className="h-12 border-2"
                            />
                        </div>
                    )}
                </div>
 
                 {serverError && (
                     <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex flex-col gap-2 border-2 border-red-200 animate-in zoom-in slide-in-from-top-4 mb-4">
                         <div className="flex items-center gap-2">
                             <AlertCircle size={20} className="shake" />
                             <span className="text-base">ERREUR DE PLANIFICATION</span>
                         </div>
                         <p className="font-medium bg-white/50 p-2 rounded-lg border border-red-100">{serverError}</p>
                     </div>
                 )}
 
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
