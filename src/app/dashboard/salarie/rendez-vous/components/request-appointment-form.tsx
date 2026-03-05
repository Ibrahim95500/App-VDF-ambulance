"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { submitAppointmentRequest } from "@/actions/appointment-request.actions"
import { Loader2 } from "lucide-react"

export function RequestAppointmentForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const reason = formData.get("reason") as string

        if (!reason) {
            toast.error("Veuillez choisir un motif.")
            return
        }

        try {
            setIsSubmitting(true)
            const result = await submitAppointmentRequest(formData)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Votre demande de rendez-vous a été envoyée avec succès")
                if (formRef.current) formRef.current.reset()
            }
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="border-border shadow-none bg-transparent">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl">Nouveau Rendez-vous</CardTitle>
                <CardDescription>
                    Soumettez une demande, la RH fixera une date et procédera à l'entretien.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Motif du rendez-vous
                        </label>
                        <Select name="reason" required disabled={isSubmitting}>
                            <SelectTrigger className="h-10 border-gray-200">
                                <SelectValue placeholder="Choisir un motif" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Point carrière">Point carrière</SelectItem>
                                <SelectItem value="Solde de tout compte">Solde de tout compte</SelectItem>
                                <SelectItem value="Question administrative">Question administrative / RH</SelectItem>
                                <SelectItem value="Conflit / Médiation">Conflit / Médiation</SelectItem>
                                <SelectItem value="Augmentation / Salaire">Augmentation / Salaire</SelectItem>
                                <SelectItem value="Autre demande">Autre demande</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Description détaillée (Optionnel)
                        </label>
                        <Textarea
                            name="description"
                            placeholder="Précisez le contexte de votre demande..."
                            className="min-h-[120px] resize-none border-gray-200"
                            disabled={isSubmitting}
                        />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full h-10 bg-secondary hover:bg-secondary/90 transition-colors">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Envoi...
                            </>
                        ) : (
                            "Envoyer la demande"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
