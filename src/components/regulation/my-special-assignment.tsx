"use client"

import { useState } from "react"
import { validateMyRegulation, validateMyDispo } from "@/actions/regulation.actions"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, PhoneCall, Clock } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface MySpecialAssignmentProps {
    assignment: any
    type: 'REGULATION' | 'DISPO'
}

export function MySpecialAssignment({ assignment, type }: MySpecialAssignmentProps) {
    const { data: session } = useSession()
    const [validated, setValidated] = useState(assignment.validated)
    const [loading, setLoading] = useState(false)
    const userId = session?.user?.id

    if (!assignment) return null

    const handleAction = async () => {
        if (!userId) return
        setLoading(true)
        try {
            const res = type === 'REGULATION' 
                ? await validateMyRegulation(userId, assignment.id)
                : await validateMyDispo(userId, assignment.id)

            if (res.error) toast.error(res.error)
            else {
                setValidated(true)
                toast.success("Votre présence est confirmée !")
            }
        } catch {
            toast.error("Erreur de validation")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-5 border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20 rounded-2xl shadow-sm mb-4">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-black text-lg text-orange-800 dark:text-orange-400 flex items-center gap-2">
                        {type === 'REGULATION' ? <PhoneCall size={20}/> : <Clock size={20}/>}
                        {type === 'REGULATION' ? "Poste de Régulation" : "Employé Disponible"}
                    </h3>
                    <p className="text-orange-700 dark:text-orange-300 font-medium text-sm mt-1">
                        Heure de début : {assignment.startTime} 
                        {type === 'REGULATION' && ` (${assignment.type})`}
                    </p>
                </div>
                {validated ? (
                    <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-bold text-sm">
                        <CheckCircle2 size={16}/> Validé
                    </div>
                ) : (
                    <span className="flex h-3 w-3 relative mt-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </span>
                )}
            </div>

            {!validated && (
                <Button 
                    className="w-full mt-4 bg-orange-500 hover:bg-orange-600 font-bold text-white" 
                    onClick={handleAction} 
                    disabled={loading}
                >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={18} className="mr-2" />}
                    Je suis disponible / Confirmer ma présence
                </Button>
            )}
        </div>
    )
}
