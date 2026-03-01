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
                        <div className="space-y-2">
                            <Label htmlFor="phone">Téléphone (Français)</Label>
                            <Input id="phone" name="phone" placeholder="06 12 34 56 78" maxLength={12} pattern="^[0-9\s]+$" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Rôle <span className="text-red-500">*</span></Label>
                            <select
                                id="role"
                                name="role"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                                defaultValue="SALARIE"
                            >
                                <option value="SALARIE">Salarié</option>
                                <option value="RH">RH / Administrateur</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="birthDate">Date de naissance</Label>
                            <Input
                                id="birthDate"
                                name="birthDate"
                                type="date"
                                max={new Date().toISOString().split('T')[0]}
                                min="1900-01-01"
                            />
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
