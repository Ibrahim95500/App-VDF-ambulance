"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { saveDisponibility, deleteDisponibility, integrateDispoToCrew } from "@/actions/regulation.actions"
import { toast } from "sonner"
import { Clock, Trash2, Plus, UserPlus, Ambulance, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DispoTabProps {
    data: any[]
    personnel: any[]
    vehicles: any[]
    dateStr: string
    onSuccess: () => void
}

export function DispoTab({ data, personnel, vehicles, dateStr, onSuccess }: DispoTabProps) {
    const [loading, setLoading] = useState(false)
    const [selectedUser, setSelectedUser] = useState("")
    const [startTime, setStartTime] = useState("08:00")

    // State pour le modal d'intégration
    const [integrateModalOpen, setIntegrateModalOpen] = useState(false)
    const [selectedDispo, setSelectedDispo] = useState<any>(null)
    const [selectedVehicleId, setSelectedVehicleId] = useState("")
    const [replacedUserId, setReplacedUserId] = useState("")
    const [integrationTime, setIntegrationTime] = useState("")

    const availableDispos = data.filter(d => d.status === "AVAILABLE")
    const integratedDispos = data.filter(d => d.status === "INTEGRATED")

    const handleAdd = async () => {
        if (!selectedUser || !startTime) {
            toast.error("Veuillez remplir tous les champs")
            return
        }

        setLoading(true)
        const res = await saveDisponibility({ userId: selectedUser, dateStr, startTime })
        setLoading(false)

        if (res.error) toast.error(res.error)
        else {
            toast.success("Disponibilité ajoutée")
            setSelectedUser("")
            onSuccess()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous supprimer cette visibilité ?")) return
        setLoading(true)
        const res = await deleteDisponibility(id)
        setLoading(false)
        if (res.error) toast.error(res.error)
        else { toast.success("Disponibilité supprimée"); onSuccess() }
    }

    const openIntegrateModal = (dispo: any) => {
        setSelectedDispo(dispo)
        setIntegrationTime(dispo.startTime) // Par défaut, on propose l'heure de sa dispo
        setSelectedVehicleId("")
        setReplacedUserId("")
        setIntegrateModalOpen(true)
    }

    const handleIntegrate = async () => {
        if (!selectedVehicleId || !replacedUserId || !integrationTime || !selectedDispo) {
            toast.error("Veuillez sélectionner un véhicule, une personne à remplacer et une heure de relève.")
            return
        }

        // Retrouver l'assignation de ce véhicule
        const vehicle = vehicles.find(v => v.id === selectedVehicleId)
        const assignment = vehicle?.assignments?.[0] // on suppose la dernière en cours
        if (!assignment) {
            toast.error("Ce véhicule n'a pas d'équipage actif.")
            return
        }

        setLoading(true)
        const res = await integrateDispoToCrew(
            selectedDispo.id,
            assignment.id,
            selectedDispo.userId,
            replacedUserId,
            integrationTime
        )
        setLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Intégration réussie ! L'historique est préservé.")
            setIntegrateModalOpen(false)
            onSuccess()
        }
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in">
            {/* Formulaire d'ajout rapide */}
            <Card className="shadow-sm border-2">
                <CardHeader className="bg-slate-50/50 border-b p-4">
                    <CardTitle className="text-lg font-black flex items-center gap-2">
                        <Plus className="text-orange-500 bg-orange-100 p-1 rounded-full" size={24} /> Ajouter une Disponibilité
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-1.5 flex-1 w-full">
                            <label className="text-sm font-bold opacity-70">Salarié</label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                                <SelectContent>
                                    {personnel.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.lastName} {p.firstName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 w-full md:w-48">
                            <label className="text-sm font-bold opacity-70">Prise de poste</label>
                            <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="font-bold" />
                        </div>
                        <Button className="w-full md:w-auto font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm" onClick={handleAdd} disabled={loading}>
                            Ajouter à la liste
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Listes */}
            <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border">
                    <h3 className="font-black text-xl mb-4 text-slate-800 dark:text-slate-200">En attente de placement (Disponibles)</h3>
                    {availableDispos.length === 0 ? (
                        <div className="text-sm text-slate-400 italic bg-white dark:bg-slate-900 rounded-xl p-6 border border-dashed text-center">
                            Aucune personne disponible en attente
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {availableDispos.map((item, i) => (
                                <div key={item.id} className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 shadow-sm rounded-xl p-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="font-black text-lg text-orange-600 flex items-center gap-2">
                                            DISPO {i + 1}
                                            {item.validated && (
                                                <Badge variant="outline" className="text-[10px] uppercase bg-green-50 text-green-600 border-green-200 h-5">Validé</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <span className="font-bold">{item.user?.lastName} {item.user?.firstName}</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"><Clock size={12}/> {item.startTime}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap md:flex-nowrap items-center gap-2 shrink-0">
                                        <Button variant="outline" size="sm" className="font-bold border-orange-200 text-orange-600 hover:bg-orange-50 bg-white min-w-[140px]" onClick={() => openIntegrateModal(item)}>
                                            <UserPlus size={14} className="mr-1.5" /> Prendre le relais
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {integratedDispos.length > 0 && (
                    <div className="p-4 border-t border-slate-200 pt-6 opacity-75">
                         <h3 className="font-bold text-slate-500 mb-4 text-sm uppercase">Déjà intégrés dans un équipage aujourd'hui</h3>
                         <div className="flex flex-wrap gap-3">
                             {integratedDispos.map(d => (
                                 <Badge key={d.id} variant="secondary" className="px-3 py-1 font-medium bg-slate-200 text-slate-600">
                                     {d.user?.lastName} {d.user?.firstName} (intégré)
                                 </Badge>
                             ))}
                         </div>
                    </div>
                )}
            </div>



            {/* Modal de Relais */}
            <Dialog open={integrateModalOpen} onOpenChange={setIntegrateModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black">
                            <UserPlus className="text-orange-500" /> Organiser une Relève
                        </DialogTitle>
                    </DialogHeader>
                    {selectedDispo && (
                        <div className="space-y-5 py-4">
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <p className="text-sm text-orange-800 font-medium">Vous allez intégrer <strong className="font-black">{selectedDispo.user?.lastName} {selectedDispo.user?.firstName}</strong> dans un véhicule pour prendre la suite de quelqu'un.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold">1. Sélectionnez le véhicule cible</label>
                                <Select value={selectedVehicleId} onValueChange={(val) => {
                                    setSelectedVehicleId(val)
                                    setReplacedUserId("") // reset
                                }}>
                                    <SelectTrigger className="font-bold border-2 h-12">
                                        <SelectValue placeholder="Choisir un véhicule avec équipage en cours..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehicles.filter(v => v.assignments && v.assignments.length > 0).map(v => (
                                            <SelectItem key={v.id} value={v.id}>
                                                AMB: {v.plateNumber} ({v.category})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedVehicleId && (
                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <label className="text-sm font-bold">2. Qui est remplacé ?</label>
                                    <Select value={replacedUserId} onValueChange={setReplacedUserId}>
                                        <SelectTrigger className="font-bold border-2 h-12">
                                            <SelectValue placeholder="Choisir l'équipier sortant..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(() => {
                                                const v = vehicles.find(v => v.id === selectedVehicleId)
                                                const a = v?.assignments?.[0]
                                                if (!a) return null
                                                return (
                                                    <>
                                                        {a.leader && <SelectItem value={a.leaderId}>Sortant: {a.leader.lastName} {a.leader.firstName} (Responsable)</SelectItem>}
                                                        {a.teammate && <SelectItem value={a.teammateId}>Sortant: {a.teammate.lastName} {a.teammate.firstName} (Co-équipier)</SelectItem>}
                                                    </>
                                                )
                                            })()}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-bold">3. Heure exacte de la relève</label>
                                <p className="text-xs text-muted-foreground leading-snug">C'est l'heure à laquelle l'ancien membre finit sa journée et le nouveau prend son service sur ce véhicule (pour l'historique).</p>
                                <Input type="time" value={integrationTime} onChange={e => setIntegrationTime(e.target.value)} className="font-bold h-12 text-lg text-center border-2 border-orange-200 focus-visible:ring-orange-500" />
                            </div>

                            <Button onClick={handleIntegrate} disabled={loading} className="w-full mt-4 h-12 font-bold text-base bg-orange-500 hover:bg-orange-600 text-white">
                                Valider la Relève <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
