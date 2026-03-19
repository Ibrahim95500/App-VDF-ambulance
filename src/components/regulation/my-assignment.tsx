"use client"

import { useState, useEffect } from "react"
import { AmbulanceCard } from "./ambulance-card"
import { validateMyPlanning } from "@/actions/regulation.actions"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2, Info, Clock3 } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

interface MyAssignmentProps {
    assignment: any
}

export function MyAssignment({ assignment }: MyAssignmentProps) {
    const { data: session } = useSession()
    const [leaderValidated, setLeaderValidated] = useState(assignment.leaderValidated)
    const [teammateValidated, setTeammateValidated] = useState(assignment.teammateValidated)
    const [status, setStatus] = useState(assignment.status)
    const [loading, setLoading] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => { setIsMounted(true) }, [])

    const userId = session?.user?.id
    const isLeader = assignment.leaderId === userId
    const isTeammate = assignment.teammateId === userId
    const hasAlreadyValidated = isLeader ? leaderValidated : isTeammate ? teammateValidated : false

    if (!assignment) return null

    // Fenêtre de validation : 19h - 21h (uniquement après montage pour éviter mismatch hydratation)
    const now = new Date()
    const currentHour = now.getHours()
    const isWindowOpen = isMounted && currentHour >= 19 && currentHour < 21

    const handleAction = async () => {
        if (!isWindowOpen) {
            toast.error("La validation n'est possible qu'entre 19h00 et 21h00.")
            return
        }
        if (!userId) return

        try {
            setLoading(true)
            const result = await validateMyPlanning(userId, assignment.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                if (isLeader) setLeaderValidated(true)
                if (isTeammate) setTeammateValidated(true)
                
                // On rafraichit potentiellement le status global si c'était le dernier à valider
                if ((isLeader && teammateValidated) || (isTeammate && leaderValidated)) {
                    setStatus('VALIDATED')
                }
                
                toast.success("Votre mission est validée !")
            }
        } catch (error) {
            toast.error("Erreur lors de la validation")
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
                leaderValidated={leaderValidated}
                teammateValidated={teammateValidated}
                status={status}
                startTime={assignment.startTime}
            />

            {!hasAlreadyValidated && isWindowOpen && (
                <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <Button
                        onClick={handleAction}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-11 shadow-lg shadow-green-100"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={18} className="mr-2" />}
                        Valider ma mission
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

            {hasAlreadyValidated && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-2xl text-green-700 dark:text-green-400 text-sm font-bold flex flex-col items-center gap-2 text-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p>Vous avez validé votre mission.</p>
                        <p className="text-xs font-normal opacity-80 mt-1">Merci pour votre ponctualité. Bonne route !</p>
                    </div>
                </div>
            )}
        </div>
    )
}
