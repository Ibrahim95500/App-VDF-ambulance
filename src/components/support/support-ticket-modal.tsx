"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

interface SupportTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SupportTicketModal({ isOpen, onClose }: SupportTicketModalProps) {
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [urgency, setUrgency] = useState("MEDIUM");
    const [category, setCategory] = useState("OTHER");
    
    // File upload state (we convert it to base64 for simplicity with the db.Text column)
    const [imageStr, setImageStr] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Veuillez sélectionner une image valide.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("L'image est trop volumineuse (maximum 5Mo).");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImageStr(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!subject.trim() || !description.trim()) {
            toast.error("Veuillez remplir le sujet et la description.");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch("/api/support/ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject,
                    description,
                    urgency,
                    category,
                    pageUrl: window.location.href, // full URL including query params
                    imageUrl: imageStr
                })
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Erreur lors de la déclaration de l'incident.");
                return;
            }

            toast.success("Votre incident a bien été transmis au support technique !");
            setSubject("");
            setDescription("");
            setImageStr(null);
            setUrgency("MEDIUM");
            setCategory("OTHER");
            onClose();
        } catch (error) {
            toast.error("Erreur réseau");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[550px] bg-card p-0 overflow-hidden border-2 border-slate-200">
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <ShieldAlert className="text-blue-500" />
                            Support IT / Créer un Ticket
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-sm mt-1">
                            Un bug ? Un blocage ? Notre équipe technique est là pour vous aider.
                        </DialogDescription>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
                    {/* Urgency & Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="font-bold text-xs text-muted-foreground uppercase">Urgence</Label>
                            <Select value={urgency} onValueChange={setUrgency}>
                                <SelectTrigger className="font-bold">
                                    <SelectValue placeholder="Sélectionnez" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW">Basse (Non bloquant)</SelectItem>
                                    <SelectItem value="MEDIUM">Moyenne (Gênant)</SelectItem>
                                    <SelectItem value="HIGH">Haute (Bloquant)</SelectItem>
                                    <SelectItem value="CRITICAL">Critique (Panne totale)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="font-bold text-xs text-muted-foreground uppercase">Catégorie</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="font-bold">
                                    <SelectValue placeholder="Sélectionnez" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SNIPER_BOT">Sniper Automatique</SelectItem>
                                    <SelectItem value="DASHBOARD">Tableau de bord / Interface</SelectItem>
                                    <SelectItem value="PLANNING">Planning / Régulation</SelectItem>
                                    <SelectItem value="MOBILE_APP">Affichage Mobile</SelectItem>
                                    <SelectItem value="OTHER">Autre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="font-bold text-xs text-muted-foreground uppercase">Sujet de l'incident</Label>
                        <Input 
                            placeholder="Ex: Le bouton de validation tourne dans le vide..."
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="font-bold text-xs text-muted-foreground uppercase">Description détaillée</Label>
                        <Textarea 
                            placeholder="Décrivez précisément ce que vous faisiez et ce qu'il s'est passé..."
                            className="min-h-[100px] resize-y"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-1.5">
                        <Label className="font-bold text-xs text-muted-foreground uppercase flex items-center justify-between w-full">
                            <span>Capture d'écran (Optionnel mais recommandé)</span>
                        </Label>
                        {!imageStr ? (
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 transition-colors duration-200">
                                <div className="space-y-1 text-center">
                                    <Upload className="mx-auto h-8 w-8 text-slate-400" />
                                    <div className="flex text-sm text-slate-600 justify-center">
                                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                            <span>Télécharger un fichier</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                    </div>
                                    <p className="text-xs text-slate-500">PNG, JPG, GIF jusqu'à 5MB</p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative mt-1 border-2 border-slate-200 rounded-xl overflow-hidden p-2">
                                <img src={imageStr} alt="Aperçu" className="max-h-40 mx-auto object-contain rounded-md" />
                                <Button 
                                    type="button" 
                                    variant="destructive" 
                                    size="icon" 
                                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                                    onClick={() => setImageStr(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-4 border-t border-slate-100 flex gap-3 sm:gap-0">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Annuler
                        </Button>
                        <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800 font-bold px-8" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Envoyer au Support
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
