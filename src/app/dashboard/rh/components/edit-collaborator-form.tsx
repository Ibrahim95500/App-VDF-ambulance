"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { updateCollaboratorAdmin } from "@/actions/users"

export function EditCollaboratorForm({ user, onCancel, onSuccess }: { user: any, onCancel: () => void, onSuccess: () => void }) {
    const [submitting, setSubmitting] = useState(false)

    // Form state
    const [role, setRole] = useState<string>((user.roles && user.roles.length > 0) ? user.roles[0] : "SALARIE")
    const [structure, setStructure] = useState<string>(user.structure || "VDF")
    const [diploma, setDiploma] = useState<string>(user.diploma || "AUXILIAIRE")
    const [shift, setShift] = useState<string>(user.shift || "JOUR")
    const [preference, setPreference] = useState<string>(user.preference || "NORMAL")
    const [isTeamLeader, setIsTeamLeader] = useState<boolean>(user.isTeamLeader || false)

    const handleRoleChange = (newRole: string) => {
        setRole(newRole)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const formData = new FormData()
            formData.append("roles", role)
            formData.append("structure", structure)
            formData.append("diploma", diploma)
            formData.append("shift", shift)
            formData.append("preference", preference)
            if (isTeamLeader) formData.append("isTeamLeader", "true")

            const result = await updateCollaboratorAdmin(user.id, formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(result.success)
                onSuccess()
            }
        } catch (error) {
            toast.error("Erreur lors de la mise à jour.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 py-4 animate-in fade-in duration-200 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-3">
                <Label className="font-bold text-muted-foreground uppercase text-xs tracking-wider">Rôles et Accès</Label>
                <Select value={role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Sélectionnez un rôle" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="SALARIE">Salarié</SelectItem>
                        <SelectItem value="REGULATEUR">Régulateur</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Structure</Label>
                    <Select value={structure} onValueChange={setStructure}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MARK">MARK Ambulance</SelectItem>
                            <SelectItem value="VDF">VDF Ambulance</SelectItem>
                            <SelectItem value="LES_2">Les Deux</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Diplôme</Label>
                    <Select value={diploma} onValueChange={setDiploma}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="AUXILIAIRE">Auxiliaire Ambulancier</SelectItem>
                            <SelectItem value="DEA">DEA</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Rythme</Label>
                    <Select value={shift} onValueChange={setShift}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                        <SelectContent>
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
                        <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                        <SelectContent>
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
                        <p className="text-[11px] text-orange-800/80 mt-1">Pré-sélectionne ou autorise ce collaborateur à piloter ce véhicule (MARK ou VDF) lors de la régulation.</p>
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
