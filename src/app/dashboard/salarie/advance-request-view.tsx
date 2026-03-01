"use client"

import { useState, useEffect } from "react"
import { ShieldAlert, Info, EuroIcon, X } from "lucide-react"
import { RequestAdvanceForm } from "./request-form"
import { AdvanceHistoryTable } from "./history-table"

interface AdvanceRequestViewProps {
    myRequests: any[]
}

export function AdvanceRequestView({ myRequests }: AdvanceRequestViewProps) {
    const [submissionError, setSubmissionError] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Target Month logic
    const today = new Date()
    const targetDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    const targetMonthName = targetDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    const isLocked = today.getDate() > 15

    if (!mounted) {
        return <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
        </div>
    }

    return (
        <div className="flex flex-col gap-5 lg:gap-7.5 max-w-5xl mx-auto w-full px-4 sm:px-0">
            <div className="flex items-center gap-3 mb-2">
                <EuroIcon className="size-8 text-secondary" />
                <h1 className="text-3xl font-bold tracking-tight text-secondary">
                    Mes Acomptes
                </h1>
            </div>

            {/* Error & Info Alerts at the TOP */}
            <div className="flex flex-col gap-3">
                {submissionError && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="size-5 shrink-0 mt-0.5" />
                            <p>{submissionError}</p>
                        </div>
                        <button
                            onClick={() => setSubmissionError(null)}
                            className="text-red-400 hover:text-red-700 transition-colors"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                )}

                {isLocked && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm font-medium flex items-start gap-3">
                        <ShieldAlert className="size-5 shrink-0 mt-0.5" />
                        <p>⚠️ Les demandes d'acompte sont fermées pour ce mois-ci. (Uniquement du 1er au 15)</p>
                    </div>
                )}

                <div className="bg-orange-50 text-orange-700 p-4 rounded-lg border border-orange-200 text-sm flex items-start gap-3">
                    <Info className="size-5 shrink-0 mt-0.5" />
                    <p>La demande d'acompte que vous formulez aujourd'hui sera déduite de votre prochain salaire : <strong>{targetMonthName}</strong>.</p>
                </div>

                <div className="bg-blue-50 text-blue-700 p-4 rounded-lg border border-blue-100 text-sm flex items-start gap-3">
                    <Info className="size-5 shrink-0 mt-0.5 text-blue-400" />
                    <p>Vous avez droit à <strong>une seule demande</strong> par mois cible. Si vous avez déjà soumis une demande pour {targetMonthName}, elle ne pourra pas être modifiée ici.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5">
                {/* Left Column: Form */}
                <div className="lg:col-span-1">
                    <div className="flex flex-col rounded-xl border border-secondary/50 border-t-4 border-t-secondary">
                        <div className="px-5 py-4 border-b border-border">
                            <h2 className="text-base font-semibold text-secondary">Nouvelle demande d'acompte</h2>
                            <p className="text-sm text-muted-foreground mt-1">Saisissez le montant souhaité.</p>
                        </div>
                        <div className="p-5">
                            <RequestAdvanceForm
                                isLocked={isLocked}
                                targetMonthName={targetMonthName}
                                onSubmissionError={setSubmissionError}
                                onSubmissionSuccess={() => setSubmissionError(null)}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: History */}
                <div className="lg:col-span-2">
                    <div className="flex flex-col rounded-xl border border-secondary/50 border-t-4 border-t-secondary">
                        <div className="px-5 py-4 border-b border-border">
                            <h2 className="text-base font-semibold text-secondary">Historique de mes demandes</h2>
                        </div>
                        <div className="p-5">
                            <AdvanceHistoryTable initialData={myRequests as any} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
