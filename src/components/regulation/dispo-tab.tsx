"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { saveDisponibility, deleteDisponibility, integrateDispoToCrew, detachDispoFromCrew, updateDisponibility } from "@/actions/regulation.actions"
import { toast } from "sonner"
import { Clock, Trash2, Plus, UserPlus, Ambulance, ArrowRight, Edit } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DispoTabProps {
    data: any[]
    personnel: any[]
    vehicles: any[]
    dateStr: string
    onSuccess: () => void
    globalAssignedIds: Set<string>
}

export function DispoTab({ data, personnel, vehicles, dateStr, onSuccess, globalAssignedIds }: DispoTabProps) {
    const [loading, setLoading] = useState(false)
    const [selectedUser, setSelectedUser] = useState("")
    const [startTime, setStartTime] = useState("08:00")

    // State pour le modal d'intégration
    const [integrateModalOpen, setIntegrateModalOpen] = useState(false)
    const [selectedDispo, setSelectedDispo] = useState<any>(null)
    const [selectedAssignmentId, setSelectedAssignmentId] = useState("")
    const [replacedUserId, setReplacedUserId] = useState("")
    const [integrationTime, setIntegrationTime] = useState("")

    // State pour le modal d'édition
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editStartTime, setEditStartTime] = useState("")
    const [editingDispoId, setEditingDispoId] = useState("")

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
        if (!confirm("❓ SUPPRESSION : Voulez-vous retirer ce salarié de la liste des disponibilités pour cette date ?")) return
        setLoading(true)
        const res = await deleteDisponibility(id)
        setLoading(false)
        if (res.error) toast.error(res.error)
        else { toast.success("Disponibilité supprimée"); onSuccess() }
    }

    const openIntegrateModal = (dispo: any) => {
        setSelectedDispo(dispo)
        setIntegrationTime(dispo.startTime) // Par défaut, on propose l'heure de sa dispo
        setSelectedAssignmentId("")
        setReplacedUserId("")
        setIntegrateModalOpen(true)
    }

    const openEditModal = (dispo: any) => {
        setEditingDispoId(dispo.id)
        setEditStartTime(dispo.startTime)
        setEditModalOpen(true)
    }

    const handleEdit = async () => {
        if (!editStartTime) {
            toast.error("L'heure de début est requise")
            return
        }

        setLoading(true)
        const res = await updateDisponibility(editingDispoId, { startTime: editStartTime })
        setLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Horaires mis à jour avec succès")
            setEditModalOpen(false)
            onSuccess()
        }
    }

    const handleIntegrate = async () => {
        if (!selectedAssignmentId || !replacedUserId || !integrationTime || !selectedDispo) {
            toast.error("Veuillez sélectionner un équipage, une personne à remplacer et une heure de relève.")
            return
        }

        setLoading(true)
        const res = await integrateDispoToCrew(
            selectedDispo.id,
            selectedAssignmentId,
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
                            <Combobox
                                options={personnel.filter(p => !globalAssignedIds.has(p.id)).map(p => ({
                                    value: p.id,
                                    label: `${p.lastName} ${p.firstName}`,
                                    description: p.diploma || "DEA"
                                }))}
                                value={selectedUser}
                                onValueChange={setSelectedUser}
                                placeholder="Sélectionner un salarié"
                                searchPlaceholder="Rechercher..."
                                className="w-full"
                            />
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

            {/* Listes Fusionnées */}
            <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border">
                    <h3 className="font-black text-xl mb-4 text-slate-800 dark:text-slate-200">En attente de placement (Disponibles)</h3>
                    {data.length === 0 ? (
                        <div className="text-sm text-slate-400 italic bg-white dark:bg-slate-900 rounded-xl p-6 border border-dashed text-center">
                            Aucune personne disponible
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.map((item, i) => {
                                const isIntegrated = item.status === "INTEGRATED";
                                let vehicleInfo = null;
                                let isLeader = false;
                                let replacedUserObj = null;
                                
                                if (isIntegrated) {
                                    const allUserAssignments = vehicles.flatMap(v => v.assignments).filter(a => a?.leaderId === item.userId || a?.teammateId === item.userId);
                                    const userAssignment = allUserAssignments.sort((a,b) => (b.startTime || '').localeCompare(a.startTime || ''))[0];
                                    
                                    if (userAssignment) {
                                        const vehicle = vehicles.find(v => v.assignments?.some((a: any) => a?.id === userAssignment.id));
                                        isLeader = userAssignment.leaderId === item.userId;
                                        vehicleInfo = vehicle;

                                        const previousAssignment = vehicle?.assignments?.find((a: any) => a.endTime === userAssignment.startTime && a.id !== userAssignment.id);
                                        if (previousAssignment) {
                                            replacedUserObj = isLeader ? previousAssignment.leader : previousAssignment.teammate;
                                        }
                                    }
                                }

                                return (
                                    <div key={item.id} className={`flex flex-col gap-4 justify-between bg-white dark:bg-slate-900 border ${isIntegrated ? 'border-orange-200 shadow-md' : 'border-slate-200 shadow-sm'} rounded-xl p-4 transition-all`}>
                                        
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-1">
                                                <div className="font-black text-lg text-orange-600 flex items-center gap-2">
                                                    DISPO {i + 1}
                                                    {item.validated ? (
                                                        <Badge variant="outline" className="text-[10px] uppercase bg-green-50 text-green-600 border-green-200 h-5">Validé ✅</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] uppercase bg-orange-50 text-orange-600 border-orange-200 h-5 animate-pulse">En attente ⏳</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm font-medium mt-1">
                                                    <span className="font-bold text-base max-w-[200px] truncate" title={`${item.user?.lastName} ${item.user?.firstName}`}>{item.user?.lastName} {item.user?.firstName}</span>
                                                </div>
                                                <div className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-md mt-1 w-fit">
                                                    <Clock size={12}/> <span className="text-xs font-bold">{item.startTime}</span>
                                                </div>
                                            </div>
                                            
                                            {isIntegrated && vehicleInfo && (
                                                <div className="flex flex-col items-end gap-1.5 shrink-0 bg-orange-50/50 p-2 rounded-lg border border-orange-100">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                        <Ambulance size={14} className="text-orange-500"/>
                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-800 hover:bg-slate-200 rounded text-[10px]">{vehicleInfo.plateNumber}</Badge>
                                                    </div>
                                                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${isLeader ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                                                        {isLeader ? "Responsable" : "Co-équipier"}
                                                    </span>
                                                    {replacedUserObj && (
                                                        <span className="text-[9px] text-slate-500 font-bold max-w-[100px] truncate" title={`Remplace: ${replacedUserObj.lastName} ${replacedUserObj.firstName}`}>
                                                            Rempl. {replacedUserObj.lastName}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 mt-auto pt-2 border-t border-slate-100">
                                            {isIntegrated ? (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="w-full text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 transition-all rounded-lg"
                                                    onClick={async () => {
                                                        if (confirm("⚠️ ATTENTION : Voulez-vous vraiment DÉTACHER ce salarié de son équipage actuel ?\\n\\nIl sera retiré de son véhicule et redeviendra disponible pour un autre placement.")) {
                                                            setLoading(true)
                                                            const res = await detachDispoFromCrew(item.id)
                                                            setLoading(false)
                                                            if (res.success) {
                                                                toast.success("Salarié détaché avec succès. Il est à nouveau disponible.")
                                                                onSuccess()
                                                            } else toast.error(res.error)
                                                        }
                                                    }}
                                                    disabled={loading}
                                                >
                                                    Détacher de l'équipage
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button variant="outline" size="sm" className="font-bold border-orange-200 text-orange-600 hover:bg-orange-50 bg-white grow" onClick={() => openIntegrateModal(item)}>
                                                        <UserPlus size={14} className="mr-1.5" /> Prendre le relais
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => openEditModal(item)} className="text-xs text-slate-600 hover:bg-slate-50 font-bold px-3">
                                                        <Edit size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-3">
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal d'édition des horaires */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black">
                            <Edit className="text-orange-500" /> Modifier l'horaire
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold">Heure de début</label>
                            <Input 
                                type="time" 
                                value={editStartTime} 
                                onChange={e => setEditStartTime(e.target.value)} 
                                className="font-bold border-2 focus-visible:ring-orange-500 h-10" 
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditModalOpen(false)}>Annuler</Button>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold" onClick={handleEdit} disabled={loading}>
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                                <label className="text-sm font-bold">1. Sélectionnez l'équipage cible</label>
                                <Select value={selectedAssignmentId} onValueChange={(val) => {
                                    setSelectedAssignmentId(val)
                                    setReplacedUserId("") // reset
                                }}>
                                    <SelectTrigger className="font-bold border-2 h-12">
                                        <SelectValue placeholder="Choisir un véhicule avec équipage en cours..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehicles.filter(v => v.assignments && v.assignments.length > 0).map(v => {
                                            const a = v.assignments[0];
                                            const isNight = a.startTime >= "12:00";
                                            return (
                                                <SelectItem key={a.id} value={a.id}>
                                                    AMB: {v.plateNumber} ({v.category}) - {isNight ? "Nuit" : "Jour"}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedAssignmentId && (
                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <label className="text-sm font-bold">2. Qui est remplacé ?</label>
                                    <Select value={replacedUserId} onValueChange={setReplacedUserId}>
                                        <SelectTrigger className="font-bold border-2 h-12">
                                            <SelectValue placeholder="Choisir l'équipier sortant..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(() => {
                                                const v = vehicles.find(v => v.assignments?.[0]?.id === selectedAssignmentId)
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
