"use client"

import { useState } from "react"
import { AmbulanceCard } from "./ambulance-card"
import { updateAssignmentStatus } from "@/actions/regulation.actions"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2, Info } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface MyAssignmentProps {
    assignment: any
}

export function MyAssignment({ assignment }: MyAssignmentProps) {
    const [status, setStatus] = useState(assignment.status)
    const [loading, setLoading] = useState(false)

    if (!assignment) return null

    // Fenêtre de validation : 19h - 21h
    const now = new Date()
    const currentHour = now.getHours()
    const isWindowOpen = currentHour >= 19 && currentHour < 21

    const handleAction = async (newStatus: 'VALIDATED' | 'REJECTED') => {
        if (!isWindowOpen) {
            toast.error("La validation n'est possible qu'entre 19h00 et 21h00.")
            return
        }
        try {
            setLoading(true)
            const result = await updateAssignmentStatus(assignment.id, newStatus)
            if (result.error) {
                toast.error(result.error)
            } else {
                setStatus(newStatus)
                toast.success(newStatus === 'VALIDATED' ? "Assignation validée !" : "Assignation refusée.")
            }
        } catch (error) {
            toast.error("Erreur lors de la mise à jour")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Info size={18} className="text-orange-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Votre mission pour demain</h2>
            </div>

            <AmbulanceCard
                plateNumber={assignment.vehicle.plateNumber}
                category={assignment.vehicle.category}
                leaderName={`${assignment.leader.lastName} ${assignment.leader.firstName}`}
                teammateName={`${assignment.teammate.lastName} ${assignment.teammate.firstName}`}
                status={status}
                startTime={assignment.startTime}
            />

            {status === 'PENDING' && isWindowOpen && (
                <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <Button
                        onClick={() => handleAction('VALIDATED')}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-11"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={18} className="mr-2" />}
                        Valider l'équipage
                    </Button>
                    <Button
                        onClick={() => handleAction('REJECTED')}
                        disabled={loading}
                        variant="destructive"
                        className="flex-1 font-bold h-11"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <XCircle size={18} className="mr-2" />}
                        Signaler un souci
                    </Button>
                </div>
            )}

            {status === 'PENDING' && !isWindowOpen && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-2 border-dashed border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col items-center text-center gap-2">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600">
                        <Info size={24} />
                    </div>
                    <p className="text-amber-800 dark:text-amber-400 font-bold">Fenêtre de validation fermée</p>
                    <p className="text-amber-600 dark:text-amber-500 text-xs">
                        Vous pourrez valider votre mission ce soir entre <span className="underline">19h00 et 21h00</span>.
                    </p>
                </div>
            )}

            {status === 'VALIDATED' && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    Vous avez validé cette mission. Bonne route !
                </div>
            )}
        </div>
    )
}
