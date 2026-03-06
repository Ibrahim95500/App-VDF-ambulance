"use client"

import { useState } from "react"
import { createAdvanceRequest } from "@/actions/advance-request.actions"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Info } from "lucide-react"

interface RequestAdvanceFormProps {
    isLocked: boolean
    targetMonthName: string
    onSubmissionError: (error: string | null) => void
    onSubmissionSuccess: () => void
}

export function RequestAdvanceForm({ isLocked, targetMonthName, onSubmissionError, onSubmissionSuccess }: RequestAdvanceFormProps) {
    const [amount, setAmount] = useState("")
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        onSubmissionError(null)

        if (isLocked) {
            toast.error("Les demandes d'acompte sont clôturées après le 15 du mois.")
            return
        }

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Le montant doit être un nombre valide supérieur à 0.")
            return
        }

        if (Number(amount) > 800) {
            toast.error("Le plafond maximum autorisé par acompte est de 800€.")
            return
        }

        try {
            setLoading(true)
            const result = await createAdvanceRequest(Number(amount), reason)

            if (result && !result.success) {
                const errMsg = result.error || "Erreur lors de l'envoi de la demande."
                onSubmissionError(errMsg)
                toast.error(errMsg, { duration: 6000 })
                return
            }

            toast.success("Demande d'acompte envoyée avec succès !")
            setAmount("")
            setReason("")
            onSubmissionSuccess()
        } catch (error: any) {
            const errMsg = "Une erreur inattendue est survenue."
            onSubmissionError(errMsg)
            toast.error(errMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 p-4 rounded-lg border border-purple-200 dark:border-purple-500/20 text-sm flex items-start gap-3">
                <Info className="size-5 shrink-0 mt-0.5" />
                <p><strong>Plafond Mensuel :</strong> Le montant maximum autorisé pour une demande d'acompte est fixé à <strong>800 €</strong>.</p>
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
                    max="800"
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
