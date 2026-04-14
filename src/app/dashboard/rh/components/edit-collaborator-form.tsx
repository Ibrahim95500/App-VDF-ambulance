"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { updateCollaboratorAdmin } from "@/actions/users"

export function EditCollaboratorForm({ user, onCancel, onSuccess }: { user: any, onCancel: () => void, onSuccess: () => void }) {
    const [submitting, setSubmitting] = useState(false)

    // Form state with absolute safety guards
    const [firstName, setFirstName] = useState(String(user?.firstName || ""))
    const [lastName, setLastName] = useState(String(user?.lastName || ""))
    const [email, setEmail] = useState(String(user?.email || ""))
    const [phone, setPhone] = useState(String(user?.phone || ""))
    const [role, setRole] = useState<string>((user?.roles && user.roles.length > 0) ? String(user.roles[0]) : "SALARIE")
    
    // Normalize empty values to "NONE" for Radix Select stability
    const [structure, setStructure] = useState<string>(user?.structure || "NONE")
    const [diploma, setDiploma] = useState<string>(user?.diploma || "NONE")
    const [shift, setShift] = useState<string>(user?.shift || "NONE")
    const [preference, setPreference] = useState<string>(user?.preference || "NONE")
    const [isTeamLeader, setIsTeamLeader] = useState<boolean>(!!user?.isTeamLeader)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (submitting) return
        setSubmitting(true)

        try {
            const formData = new FormData()
            formData.append("firstName", firstName)
            formData.append("lastName", lastName)
            formData.append("email", email)
            formData.append("phone", phone)
            formData.append("roles", role)
            formData.append("structure", structure === "NONE" ? "" : structure)
            formData.append("diploma", diploma === "NONE" ? "" : diploma)
            formData.append("shift", shift === "NONE" ? "" : shift)
            formData.append("preference", preference === "NONE" ? "" : preference)
            if (isTeamLeader) formData.append("isTeamLeader", "true")

            const result = await updateCollaboratorAdmin(user.id, formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(result.success)
                onSuccess()
            }
        } catch (error) {
            console.error("Form submission error:", error)
            toast.error("Erreur lors de la mise à jour.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 py-4 animate-in fade-in duration-200 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Prénom</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-10 border-slate-300" placeholder="Prénom" />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Nom</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-10 border-slate-300" placeholder="Nom" />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Adresse Email</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="h-10 border-slate-300" placeholder="email@exemple.com" />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Téléphone (Contact)</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 border-slate-300" placeholder="Ex: 06..." />
                </div>
            </div>

            <div className="space-y-3">
                <Label className="font-bold text-muted-foreground uppercase text-xs tracking-wider">Rôle et Accès principal</Label>
                <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-10 text-sm border-slate-300"><SelectValue placeholder="Sélectionnez un rôle" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="SALARIE">Salarié</SelectItem>
                        <SelectItem value="RH">RH / Admin</SelectItem>
                        <SelectItem value="REGULATEUR">Régulateur</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="SERVICE_IT">Support IT ServiceNow</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Structure</Label>
                    <Select value={structure} onValueChange={setStructure}>
                        <SelectTrigger className="h-10 text-sm border-slate-300"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NONE">Non défini</SelectItem>
                            <SelectItem value="MARK">MARK Ambulance</SelectItem>
                            <SelectItem value="VDF">VDF Ambulance</SelectItem>
                            <SelectItem value="LES_2">Les Deux</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Diplôme</Label>
                    <Select value={diploma} onValueChange={setDiploma}>
                        <SelectTrigger className="h-10 text-sm border-slate-300"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NONE">Non défini</SelectItem>
                            <SelectItem value="AUXILIAIRE">Auxiliaire Ambulancier</SelectItem>
                            <SelectItem value="DEA">DEA</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Rythme</Label>
                    <Select value={shift} onValueChange={setShift}>
                        <SelectTrigger className="h-10 text-sm border-slate-300"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NONE">Non défini</SelectItem>
                            <SelectItem value="JOUR">Jour</SelectItem>
                            <SelectItem value="NUIT">Nuit</SelectItem>
                            <SelectItem value="VACATAIRE">Vacataire</SelectItem>
                            <SelectItem value="JOUR_NUIT">Jour & Nuit</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Préférence</Label>
                    <Select value={preference} onValueChange={setPreference}>
                        <SelectTrigger className="h-10 text-sm border-slate-300"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NONE">Non défini</SelectItem>
                            <SelectItem value="NORMAL">Normale</SelectItem>
                            <SelectItem value="SAMEDI">Samedi Dispo.</SelectItem>
                            <SelectItem value="NUIT">Nuit Préférée</SelectItem>
                            <SelectItem value="MATIN">Matin Préféré</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-orange-50/70 p-4 border-2 border-orange-400 rounded-xl space-y-3">
                <Label className="font-bold text-orange-800 uppercase text-xs tracking-wider">Régulation d'Équipage</Label>
                <div className="flex items-center space-x-3">
                    <Checkbox id="isTeamLeaderEdit" checked={isTeamLeader} onCheckedChange={(c) => setIsTeamLeader(!!c)} className="border-orange-400 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600" />
                    <div className="space-y-1 leading-none">
                        <label htmlFor="isTeamLeaderEdit" className="text-sm font-semibold text-orange-950 cursor-pointer">
                            Responsable de Bord <span className="text-orange-600 text-xs uppercase tracking-wide ml-1">(Responsable Véhicule)</span>
                        </label>
                        <p className="text-[11px] text-orange-800/80 mt-1">Autorise ce collaborateur à piloter un véhicule (MARK ou VDF) lors de la régulation.</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
                <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                    Annuler
                </Button>
                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Enregistrer
                </Button>
            </div>
        </form>
    )
}
