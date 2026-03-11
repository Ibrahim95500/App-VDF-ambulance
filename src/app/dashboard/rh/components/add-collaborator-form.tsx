"use client"

import { useState } from "react"
import { createCollaborator } from "@/actions/users"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LoaderCircleIcon } from "lucide-react"

export function AddCollaboratorForm() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

    async function handleAddCollaborator(formData: FormData) {
        setLoading(true)
        setMessage(null)

        try {
            const result = await createCollaborator(formData)

            if (result.error) {
                setMessage({ type: "error", text: result.error })
            } else if (result.success) {
                setMessage({ type: "success", text: result.success })
                // Safely reset form
                const formElement = document.getElementById("add-collaborator-form") as HTMLFormElement
                if (formElement) formElement.reset()
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
                    Créez un compte pour un employé. Il recevra un mot de passe par email.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form id="add-collaborator-form" action={handleAddCollaborator} className="space-y-4">
                    {message && (
                        <div className={`p-3 text-sm rounded-md ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Prénom <span className="text-red-500">*</span></Label>
                            <Input id="firstName" name="firstName" required placeholder="Ex: Jean" maxLength={50} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Nom <span className="text-red-500">*</span></Label>
                            <Input id="lastName" name="lastName" required placeholder="Ex: Dupont" maxLength={50} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Adresse Email <span className="text-red-500">*</span></Label>
                        <Input id="email" name="email" type="email" required placeholder="jean.dupont@ambulance.com" maxLength={100} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <Label htmlFor="roles">Rôle <span className="text-red-500">*</span></Label>
                            <select id="roles" name="roles" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="SALARIE">Salarié</option>
                                <option value="REGULATEUR">Régulateur</option>
                                <option value="RH">RH</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="birthDate">Date de naissance</Label>
                                <Input id="birthDate" name="birthDate" type="date" max={new Date().toISOString().split('T')[0]} min="1900-01-01" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Téléphone</Label>
                                <Input id="phone" name="phone" placeholder="06 12 34 56 78" maxLength={12} pattern="^[0-9\\s]+$" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-border mt-4 mb-2">
                        <h4 className="text-sm font-bold text-secondary mb-3">Informations de Régulation métier</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="structure">Structure</Label>
                                <select id="structure" name="structure" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">Non défini</option>
                                    <option value="MARK">MARK</option>
                                    <option value="VDF">VDF</option>
                                    <option value="LES_2">MARK & VDF</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="diploma">Diplôme</Label>
                                <select id="diploma" name="diploma" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">Non défini</option>
                                    <option value="AUXILIAIRE">Auxiliaire</option>
                                    <option value="DEA">DEA</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shift">Roulement</Label>
                                <select id="shift" name="shift" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">Non défini</option>
                                    <option value="JOUR">Jour</option>
                                    <option value="NUIT">Nuit</option>
                                    <option value="VACATAIRE">Vacataire</option>
                                    <option value="JOUR_NUIT">Jour & Nuit</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="preference">Préférence</Label>
                                <select id="preference" name="preference" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">Non défini</option>
                                    <option value="NORMAL">Normale</option>
                                    <option value="SAMEDI">Samedi</option>
                                    <option value="NUIT">Nuit exclusif</option>
                                    <option value="MATIN">Matin</option>
                                </select>
                            </div>
                            <div className="col-span-1 md:col-span-2 space-y-2 mt-1 p-3 bg-orange-50/70 rounded-lg border-2 border-orange-400">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" name="isTeamLeader" className="size-5 rounded border-orange-400 text-orange-600 focus:ring-orange-600" />
                                    <div>
                                        <p className="font-bold text-sm text-orange-950">Responsable de Bord <span className="text-orange-600 text-xs uppercase tracking-wide ml-1">(Responsable Véhicule)</span></p>
                                        <p className="text-xs text-orange-800/80">Pré-sélectionne ou autorise ce collaborateur à piloter ce véhicule (MARK ou VDF) lors de la régulation.</p>
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
