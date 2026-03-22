"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { saveRegulationAssignment, deleteRegulationAssignment } from "@/actions/regulation.actions"
import { toast } from "sonner"
import { Clock, User, Trash2, Plus, PhoneCall } from "lucide-react"

interface RegulationTabProps {
    data: any[]
    personnel: any[]
    dateStr: string
    onSuccess: () => void
}

export function RegulationTab({ data, personnel, dateStr, onSuccess }: RegulationTabProps) {
    const [loading, setLoading] = useState(false)
    const [selectedUser, setSelectedUser] = useState("")
    const [selectedType, setSelectedType] = useState("MATIN")
    const [startTime, setStartTime] = useState("05:30")

    const handleAdd = async () => {
        if (!selectedUser || !startTime) {
            toast.error("Veuillez remplir tous les champs")
            return
        }

        setLoading(true)
        const res = await saveRegulationAssignment({
            userId: selectedUser,
            dateStr,
            type: selectedType,
            startTime
        })
        setLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Régulateur ajouté")
            setSelectedUser("")
            onSuccess()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment retirer ce régulateur ?")) return
        setLoading(true)
        const res = await deleteRegulationAssignment(id)
        setLoading(false)
        if (res.error) toast.error(res.error)
        else {
            toast.success("Régulateur retiré")
            onSuccess()
        }
    }

    const renderCategory = (title: string, type: string) => {
        const items = data.filter(d => d.type === type)
        return (
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-2 border-b pb-2">
                    <PhoneCall size={18} className="text-orange-500" />
                    <h3 className="font-black text-lg text-slate-800 dark:text-slate-200">{title}</h3>
                </div>
                {items.length === 0 ? (
                    <div className="text-sm text-slate-400 italic bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-dashed text-center">
                        Aucun régulateur
                    </div>
                ) : (
                    items.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 shadow-sm rounded-xl p-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 text-orange-600 font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1.5">
                                    <Clock size={14} />
                                    {item.startTime}
                                </div>
                                <div className="font-bold flex items-center gap-2">
                                    {item.user?.firstName} {item.user?.lastName}
                                    {item.validated && (
                                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">Validé</span>
                                    )}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(item.id)} disabled={loading}>
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in">
            {/* Formulaire */}
            <Card className="shadow-sm border-2">
                <CardHeader className="bg-slate-50/50 border-b p-4">
                    <CardTitle className="text-lg font-black flex items-center gap-2">
                        <Plus className="text-orange-500 bg-orange-100 p-1 rounded-full" size={24} /> Ajouter un régulateur
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-1.5 w-full md:w-1/4">
                            <label className="text-sm font-bold opacity-70">Type de poste</label>
                            <Select value={selectedType} onValueChange={(val) => {
                                setSelectedType(val)
                                setStartTime(val === "MATIN" ? "05:30" : val === "SOIR" ? "09:30" : "06:00")
                            }}>
                                <SelectTrigger className="font-bold"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MATIN">Matin</SelectItem>
                                    <SelectItem value="SOIR">Soir</SelectItem>
                                    <SelectItem value="DIALYSE">Dialyse</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5 flex-1 w-full">
                            <label className="text-sm font-bold opacity-70">Personne</label>
                            <Combobox
                                options={personnel.filter(p => p.isRegulateur).map(p => ({
                                    value: p.id,
                                    label: `${p.lastName} ${p.firstName}`
                                }))}
                                value={selectedUser}
                                onValueChange={setSelectedUser}
                                placeholder="Sélectionner un régulateur"
                                searchPlaceholder="Rechercher..."
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-1.5 w-full md:w-32">
                            <label className="text-sm font-bold opacity-70">Début</label>
                            <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="font-bold" />
                        </div>

                        <Button className="w-full md:w-auto font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm" onClick={handleAdd} disabled={loading}>
                            Ajouter
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Listes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border">
                {renderCategory("PLANNING MATIN", "MATIN")}
                {renderCategory("PLANNING SOIR", "SOIR")}
                {renderCategory("DIALYSE", "DIALYSE")}
            </div>
        </div>
    )
}
