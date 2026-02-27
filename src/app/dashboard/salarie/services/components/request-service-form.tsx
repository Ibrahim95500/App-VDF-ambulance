"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
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
import { createServiceRequest } from "@/actions/service-request.actions"
import { Loader2, Send } from "lucide-react"

const formSchema = z.object({
    category: z.string().min(1, "Veuillez choisir une catégorie"),
    subject: z.string().min(3, "Le sujet est trop court"),
    description: z.string().min(10, "Veuillez détailler votre demande"),
})

export function RequestServiceForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category: "",
            subject: "",
            description: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsSubmitting(true)
            await createServiceRequest(values.category, values.subject, values.description)
            toast.success("Votre demande a été envoyée avec succès")
            form.reset()
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl">Nouvelle Demande</CardTitle>
                <CardDescription>
                    Remplissez ce formulaire pour envoyer une demande au service concerné.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Catégorie</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isSubmitting}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-10 border-gray-200">
                                                <SelectValue placeholder="Choisir un type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="RH">Ressources Humaines (RH)</SelectItem>
                                            <SelectItem value="MATERIEL">Matériel / Équipement</SelectItem>
                                            <SelectItem value="PLANNING">Planning / Horaires</SelectItem>
                                            <SelectItem value="AUTRE">Autre besoin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sujet</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: Demande de nouveaux gants"
                                            {...field}
                                            className="h-10 border-gray-200"
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description détaillée</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Précisez votre besoin ici..."
                                            className="min-h-[120px] resize-none border-gray-200"
                                            {...field}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-semibold"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Envoi en cours...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
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
