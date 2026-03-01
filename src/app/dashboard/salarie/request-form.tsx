"use client"

import { useState } from "react"
import { createAdvanceRequest } from "@/actions/advance-request.actions"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function RequestAdvanceForm() {
    const [amount, setAmount] = useState("")
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)

    // Target Month logic
    const today = new Date()
    const targetDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    const targetMonthName = targetDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    const isLocked = today.getDate() > 15

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (isLocked) {
            toast.error("Les demandes d'acompte sont clôturées après le 15 du mois.")
            return
        }

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Le montant doit être un nombre valide supérieur à 0.")
            return
        }

        try {
            setLoading(true)
            await createAdvanceRequest(Number(amount), reason)
            toast.success("Demande d'acompte envoyée avec succès !")
            setAmount("")
            setReason("")
        } catch (error: any) {
            // Handle the specific "already requested" error from the server
            const errorMessage = error.message || "Erreur lors de l'envoi de la demande."
            toast.error(errorMessage, {
                duration: 6000,
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {isLocked && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm font-medium">
                    ⚠️ Les demandes d'acompte sont fermées pour ce mois-ci. (Uniquement du 1er au 15)
                </div>
            )}

            <div className="flex flex-col gap-2">
                <div className="bg-orange-50 text-orange-700 p-4 rounded-lg border border-orange-200 text-sm">
                    La demande d'acompte que vous formulez aujourd'hui sera déduite de votre prochain salaire : <strong>{targetMonthName}</strong>.
                </div>

                <div className="bg-blue-50 text-blue-700 p-3 rounded-lg border border-blue-100 text-[12px] flex items-start gap-2">
                    <span className="shrink-0 font-bold">ℹ️</span>
                    <span>Vous avez droit à <strong>une seule demande</strong> par mois cible. Si vous avez déjà soumis une demande pour {targetMonthName}, elle ne pourra pas être modifiée ici.</span>
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">Montant de l'acompte (€)</label>
                <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ex: 200"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isLocked || loading}
                    max="5000"
                    className="h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secondary disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">Motif (Optionnel)</label>
                <textarea
                    placeholder="Ex: Réparation véhicule..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={isLocked || loading}
                    rows={3}
                    maxLength={500}
                    className="px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secondary disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>

            <div className="flex justify-end pt-2">
                <Button
                    type="submit"
                    variant="secondary"
                    disabled={isLocked || loading}
                >
                    {loading ? "Envoi en cours..." : "Soumettre la demande"}
                </Button>
            </div>
        </form>
    )
}
