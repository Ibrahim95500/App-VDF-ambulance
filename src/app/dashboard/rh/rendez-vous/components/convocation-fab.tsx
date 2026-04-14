"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Calendar, User, AlignLeft, Phone, MapPin } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { toast } from "sonner"
import { createConvocationAction } from "@/actions/appointment-request.actions"

type UserForConvocation = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
}

export function ConvocationFab({ employees }: { employees: UserForConvocation[] }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedUser, setSelectedUser] = useState("");
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [appointmentDate, setAppointmentDate] = useState("");
    const [appointmentMode, setAppointmentMode] = useState("BUREAU");

    const reasonOptions = [
        "Point d'étape / Bilan",
        "Incident de transport",
        "Avertissement ou Sanction",
        "Gestion d'un conflit",
        "Évaluation annuelle",
        "Retour d'arrêt maladie",
        "Modification du contrat",
        "Autre métier"
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !reason || !appointmentDate) {
            toast.error("Veuillez remplir les champs obligatoires (Salarié, Motif, Date).");
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await createConvocationAction(
                selectedUser,
                reason,
                new Date(appointmentDate),
                appointmentMode,
                description
            );

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Convocation envoyée avec succès.");
                setOpen(false);
                setSelectedUser("");
                setReason("");
                setDescription("");
                setAppointmentDate("");
                setAppointmentMode("BUREAU");
            }
        } catch (error: any) {
            toast.error("Une erreur est survenue lors de la convocation.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="fixed bottom-24 right-4 md:bottom-8 md:right-8 h-12 sm:h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-500/30 px-4 sm:px-6 font-bold z-40 flex items-center gap-2 group transition-all hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300 shrink-0" />
                <span>Nouvelle Convocation</span>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" /> Convoquer un salarié
                        </DialogTitle>
                        <DialogDescription>
                            Créez une convocation officielle. Le salarié sera immédiatement notifié et ce rendez-vous sera approuvé par défaut.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" /> Salarié concerné *
                            </label>
                            <Combobox
                                options={employees.map(emp => ({
                                    value: emp.id,
                                    label: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email || 'Inconnu',
                                }))}
                                value={selectedUser}
                                onValueChange={setSelectedUser}
                                placeholder="Sélectionner un collaborateur"
                                searchPlaceholder="Rechercher par nom..."
                                className="w-full bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <AlignLeft className="w-4 h-4 text-muted-foreground" /> Motif de la convocation *
                            </label>
                            <Select value={reason} onValueChange={setReason} required disabled={isSubmitting}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir un motif" />
                                </SelectTrigger>
                                <SelectContent>
                                    {reasonOptions.map((r, i) => (
                                        <SelectItem key={i} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date et Heure *</label>
                                <Input
                                    type="datetime-local"
                                    required
                                    value={appointmentDate}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                    className="[&::-webkit-calendar-picker-indicator]:dark:invert-0"
                                    style={{ colorScheme: 'light' }}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Modalité *</label>
                                <Select value={appointmentMode} onValueChange={setAppointmentMode} required disabled={isSubmitting}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BUREAU">Au Bureau</SelectItem>
                                        <SelectItem value="TELEPHONE">Par Téléphone</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Précisions supplémentaires (Optionnel)</label>
                            <Textarea
                                placeholder="Ajoutez un message pour le salarié..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[100px] resize-none"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Envoyer la convocation
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
