"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
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
import { Loader2, Send } from "lucide-react"

const formSchema = z.object({
    reason: z.string().min(1, "Veuillez choisir un motif."),
    description: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.reason === "Autre") {
        if (!data.description || data.description.trim().length < 30) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Pour le motif « Autre », le détail est obligatoire (minimum 30 caractères).",
                path: ["description"],
            })
        }
    } else if (data.description && data.description.trim().length > 0 && data.description.trim().length < 30) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le motif doit contenir au moins 30 caractères.",
            path: ["description"],
        })
    }
})

export function RequestAppointmentForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            reason: "",
            description: "",
        },
    })

    const selectedReason = form.watch("reason")

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsSubmitting(true)
            const formData = new FormData()
            formData.set("reason", values.reason)
            formData.set("description", values.description || "")
            const result = await submitAppointmentRequest(formData)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Votre demande de rendez-vous a été envoyée avec succès")
                form.reset()
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
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Motif du rendez-vous</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || undefined}
                                        disabled={isSubmitting}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-10 border-gray-200">
                                                <SelectValue placeholder="Choisir un motif" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Point carrière">Point carrière</SelectItem>
                                            <SelectItem value="Question administrative">Question administrative / RH</SelectItem>
                                            <SelectItem value="Conflit / Médiation">Conflit / Médiation</SelectItem>
                                            <SelectItem value="Autre">Autre</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Motif de la demande de RDV{" "}
                                        {selectedReason === "Autre" && (
                                            <span className="text-red-500 font-normal text-xs">
                                                * Obligatoire — min. 30 caractères
                                            </span>
                                        )}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Précisez le contexte de votre demande..."
                                            className="min-h-[120px] resize-none border-gray-200"
                                            disabled={isSubmitting}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-semibold transition-colors"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Envoi en cours...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Envoyer la demande
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
