"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createLeaveRequest } from '@/actions/leave-request.actions';

export function LeaveForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: '',
        startDate: '',
        endDate: '',
        startAmPm: 'Jour complet',
        endAmPm: 'Jour complet',
        reason: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        if (!formData.type || !formData.startDate || !formData.endDate) {
            toast.error("Veuillez remplir les champs obligatoires (*)");
            return;
        }

        setLoading(true);
        try {
            await createLeaveRequest(
                formData.type,
                formData.startDate,
                formData.endDate,
                formData.startAmPm,
                formData.endAmPm,
                formData.reason
            );
            toast.success("Demande de congé envoyée avec succès");
            // Reset form
            setFormData({
                type: '',
                startDate: '',
                endDate: '',
                startAmPm: 'Jour complet',
                endAmPm: 'Jour complet',
                reason: ''
            });
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'envoi de la demande");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col rounded-xl border border-border h-full">
            <div className="px-5 py-4 border-b border-border bg-muted/5 rounded-t-xl">
                <h2 className="text-base font-semibold text-foreground uppercase tracking-wide">
                    Nouvelle Absence <span className="text-primary font-normal normal-case text-sm">- Création en cours</span>
                </h2>
            </div>

            <div className="p-6 flex flex-col gap-6 flex-grow">
                {/* Motif */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        Pour le motif <span className="text-primary font-bold">(*)</span>
                    </label>
                    <select name="type" value={formData.type} onChange={handleChange} className="h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm w-full outline-none focus:ring-1 focus:ring-primary font-medium">
                        <option value="">Sélectionner</option>
                        <option value="cp">Congé payé (CP)</option>
                        <option value="ma">Maladie (MA)</option>
                        <option value="css">Congé sans solde (CSS)</option>
                    </select>
                </div>

                {/* Période */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                        Période <span className="text-primary font-bold">(*)</span>
                    </label>

                    <div className="flex flex-col gap-3 mt-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium w-8 text-muted-foreground text-right mr-2">Du</span>
                            <div className="relative flex-1">
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="h-10 px-3 py-2 pl-10 rounded-md border border-input bg-transparent text-sm w-full outline-none focus:ring-1 focus:ring-primary"
                                    min={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                    max={new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                />
                            </div>
                            <select name="startAmPm" value={formData.startAmPm} onChange={handleChange} className="h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm w-1/3 outline-none focus:ring-1 focus:ring-primary">
                                <option>Jour complet</option>
                                <option>Matin</option>
                                <option>Après-midi</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium w-8 text-muted-foreground text-right mr-2">Au</span>
                            <div className="relative flex-1">
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className="h-10 px-3 py-2 pl-10 rounded-md border border-input bg-transparent text-sm w-full outline-none focus:ring-1 focus:ring-primary"
                                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                                    max={new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                />
                            </div>
                            <select name="endAmPm" value={formData.endAmPm} onChange={handleChange} className="h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm w-1/3 outline-none focus:ring-1 focus:ring-primary">
                                <option>Jour complet</option>
                                <option>Matin</option>
                                <option>Après-midi</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Comment & Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            Commentaire
                        </label>
                        <textarea
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            maxLength={1000}
                            className="px-3 py-2 rounded-md border border-input bg-transparent text-sm w-full outline-none focus:ring-1 focus:ring-primary min-h-[100px] resize-none"
                        ></textarea>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                            Pièces jointes
                        </label>
                        <div className="border border-input border-dashed bg-muted/20 rounded-md p-4 flex items-center justify-center text-sm text-muted-foreground cursor-pointer hover:bg-muted/40 transition-colors min-h-[100px]">
                            Ajouter une pièce jointe
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted/5 flex items-center gap-3 rounded-b-xl mt-auto">
                <Button onClick={handleSubmit} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 font-semibold">
                    {loading ? "En cours..." : "ENREGISTRER ✓"}
                </Button>
                <Button onClick={() => setFormData({ type: '', startDate: '', endDate: '', startAmPm: 'Jour complet', endAmPm: 'Jour complet', reason: '' })} variant="outline" className="rounded-full px-6 bg-transparent border-border hover:bg-muted">
                    ANNULER ✕
                </Button>
            </div>
        </div>
    )
}
