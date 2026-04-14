"use client"

import { useState } from "react"
import { createCollaborator } from "@/actions/users"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LoaderCircleIcon, CheckCircle2, AlertCircle } from "lucide-react"

interface FormState {
    firstName: string
    lastName: string
    email: string
    phone: string
    role: string
    structure: string
    diploma: string
    shift: string
    preference: string
    isTeamLeader: boolean
}

const DEFAULT_STATE: FormState = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "SALARIE",
    structure: "",
    diploma: "",
    shift: "",
    preference: "",
    isTeamLeader: false,
}

export function AddCollaboratorForm() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
    const [form, setForm] = useState<FormState>(DEFAULT_STATE)

    const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }))
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            const formData = new FormData()
            formData.append("firstName", form.firstName.trim())
            formData.append("lastName", form.lastName.trim())
            formData.append("email", form.email.trim())
            if (form.phone) formData.append("phone", form.phone.trim())
            formData.append("roles", form.role)
            if (form.structure) formData.append("structure", form.structure)
            if (form.diploma) formData.append("diploma", form.diploma)
            if (form.shift) formData.append("shift", form.shift)
            if (form.preference) formData.append("preference", form.preference)
            if (form.isTeamLeader) formData.append("isTeamLeader", "true")

            const result = await createCollaborator(formData)

            if (result.error) {
                // En cas d'erreur, le formulaire NE se réinitialise pas (les données sont dans le state React)
                setMessage({ type: "error", text: result.error })
            } else if (result.success) {
                setMessage({ type: "success", text: result.success })
                setForm(DEFAULT_STATE) // Reset uniquement en cas de succès
            }
        } catch (error) {
            setMessage({ type: "error", text: "Une erreur inattendue s'est produite." })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-secondary/50 shadow-sm border-t-4 border-t-secondary">
            <CardHeader>
                <CardTitle className="text-lg text-secondary">Ajouter un collaborateur</CardTitle>
                <CardDescription>
                    Créez un compte pour un employé. Il recevra ses identifiants par email automatiquement.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {message && (
                        <div className={`p-3 text-sm rounded-md flex items-start gap-2 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                            {message.type === "success" ? <CheckCircle2 className="size-4 shrink-0 mt-0.5" /> : <AlertCircle className="size-4 shrink-0 mt-0.5" />}
                            <span>{message.text}</span>
                        </div>
                    )}

                    {/* Identité */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Prénom <span className="text-red-500">*</span></Label>
                            <Input
                                id="firstName" name="firstName" required placeholder="Ex: Jean"
                                maxLength={50} value={form.firstName} onChange={set("firstName")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Nom <span className="text-red-500">*</span></Label>
                            <Input
                                id="lastName" name="lastName" required placeholder="Ex: Dupont"
                                maxLength={50} value={form.lastName} onChange={set("lastName")}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Adresse Email <span className="text-red-500">*</span></Label>
                        <Input
                            id="email" name="email" type="email" required
                            placeholder="jean.dupont@ambulance.com" maxLength={100}
                            value={form.email} onChange={set("email")}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="roles">Rôle <span className="text-red-500">*</span></Label>
                            <select
                                id="roles" name="roles" required
                                value={form.role} onChange={set("role")}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="SALARIE">Salarié</option>
                                <option value="REGULATEUR">Régulateur</option>
                                <option value="ADMIN">Admin</option>
                                <option value="SERVICE_IT">Support IT ServiceNow</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Téléphone</Label>
                            <Input
                                id="phone" name="phone" placeholder="06 12 34 56 78"
                                maxLength={12} pattern="^[0-9\s]+" value={form.phone} onChange={set("phone")}
                            />
                        </div>
                    </div>

                    {/* Informations de Régulation */}
                    <div className="pt-2 border-t border-border mt-4 mb-2">
                        <h4 className="text-sm font-bold text-secondary mb-3">Informations de Régulation métier</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="structure">Structure</Label>
                                <select
                                    id="structure" name="structure"
                                    value={form.structure} onChange={set("structure")}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">Non défini</option>
                                    <option value="MARK">MARK Ambulance</option>
                                    <option value="VDF">VDF Ambulance</option>
                                    <option value="LES_2">MARK &amp; VDF (Les deux)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="diploma">Diplôme</Label>
                                <select
                                    id="diploma" name="diploma"
                                    value={form.diploma} onChange={set("diploma")}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">Non défini</option>
                                    <option value="AUXILIAIRE">Auxiliaire</option>
                                    <option value="DEA">DEA</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shift">Roulement</Label>
                                <select
                                    id="shift" name="shift"
                                    value={form.shift} onChange={set("shift")}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">Non défini</option>
                                    <option value="JOUR">Jour</option>
                                    <option value="NUIT">Nuit</option>
                                    <option value="VACATAIRE">Vacataire</option>
                                    <option value="JOUR_NUIT">Jour &amp; Nuit</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="preference">Préférence</Label>
                                <select
                                    id="preference" name="preference"
                                    value={form.preference} onChange={set("preference")}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">Non défini</option>
                                    <option value="NORMAL">Normale</option>
                                    <option value="SAMEDI">Samedi</option>
                                    <option value="NUIT">Nuit exclusif</option>
                                    <option value="MATIN">Matin</option>
                                </select>
                            </div>
                            <div className="col-span-1 md:col-span-2 space-y-2 mt-1 p-3 bg-orange-50/70 rounded-lg border-2 border-orange-400">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox" name="isTeamLeader"
                                        checked={form.isTeamLeader}
                                        onChange={(e) => setForm(prev => ({ ...prev, isTeamLeader: e.target.checked }))}
                                        className="size-5 rounded border-orange-400 text-orange-600 focus:ring-orange-600"
                                    />
                                    <div>
                                        <p className="font-bold text-sm text-orange-950">Responsable de Bord <span className="text-orange-600 text-xs uppercase tracking-wide ml-1">(Chef d'équipe)</span></p>
                                        <p className="text-xs text-orange-800/80">Autorise ce collaborateur à être responsable de véhicule lors de la régulation.</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading} variant="secondary" className="w-full md:w-auto">
                            {loading && <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />}
                            Créer le compte
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
