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
import { User, ShieldCheck, Clock, CheckCircle2, Loader2 } from "lucide-react"
import { saveAssignment } from "@/actions/regulation.actions"
import { toast } from "sonner"

interface Personnel {
    id: string
    firstName: string | null
    lastName: string | null
    diploma: string | null
    isTeamLeader: boolean
    structure: 'MARK' | 'VDF' | 'LES_2' | null
}

interface AssignmentDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    vehicleId: string
    plateNumber: string
    category: 'MARK' | 'VDF'
    date: Date
    personnel: Personnel[]
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
    personnel,
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

    const handleSave = async () => {
        if (!leaderId || !teammateId) {
            toast.error("Veuillez sélectionner un équipage complet.")
            return
        }

        if (leaderId === teammateId) {
            toast.error("Le responsable et le co-équipier doivent être différents.")
            return
        }

        try {
            setLoading(true)
            const result = await saveAssignment({
                vehicleId,
                leaderId,
                teammateId,
                date,
                startTime,
                endTime
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Assignation enregistrée !")
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase opacity-60">Prise de service</Label>
                            <Input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase opacity-60">Fin de service</Label>
                            <Input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="font-bold"
                            />
                        </div>
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
                                {personnel
                                    .filter(p => p.isTeamLeader === true)
                                    .filter(p => category === 'MARK' ? (p.structure === 'MARK' || p.structure === 'LES_2') : (p.structure === 'VDF' || p.structure === 'LES_2'))
                                    .map(p => (
                                        <SelectItem key={p.id} value={p.id} className="py-3">
                                            <div className="flex flex-col">
                                                <span className="font-bold">{p.lastName} {p.firstName}</span>
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
                                {personnel
                                    .filter(p => category === 'MARK' ? (p.structure === 'MARK' || p.structure === 'LES_2') : (p.structure === 'VDF' || p.structure === 'LES_2'))
                                    .map(p => (
                                        <SelectItem key={p.id} value={p.id} className="py-3">
                                            <div className="flex flex-col">
                                                <span className="font-bold">{p.lastName} {p.firstName}</span>
                                                <span className="text-[10px] opacity-60 uppercase">{p.diploma || "Auxiliaire"}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={18} className="mr-2" />}
                        Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
