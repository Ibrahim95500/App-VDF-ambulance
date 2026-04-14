"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, X, ShieldAlert, PlusCircle, History } from "lucide-react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SupportTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SupportTicketModal({ isOpen, onClose }: SupportTicketModalProps) {
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    const [fetchingHistory, setFetchingHistory] = useState(false);
    const [myTickets, setMyTickets] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("new");

    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [urgency, setUrgency] = useState("MEDIUM");
    const [category, setCategory] = useState("OTHER");
    
    const [imageStr, setImageStr] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && activeTab === "history") {
            fetchMyTickets();
        }
    }, [isOpen, activeTab]);

    const fetchMyTickets = async () => {
        setFetchingHistory(true);
        try {
            const res = await fetch("/api/support/ticket");
            const data = await res.json();
            if (res.ok) {
                setMyTickets(data);
            }
        } catch (error) {
            console.error("Erreur de récupération des tickets", error);
        } finally {
            setFetchingHistory(false);
        }
    };

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
            setActiveTab("history"); // Bascule vers l'historique
        } catch (error) {
            toast.error("Erreur réseau");
        } finally {
            setLoading(false);
        }
    };

    const getStatusTextAndColor = (status: string) => {
        switch (status) {
            case "OPEN": return { label: "Nouveau", color: "text-blue-600 bg-blue-50 border-blue-200" };
            case "IN_PROGRESS": return { label: "Analyse en cours", color: "text-orange-600 bg-orange-50 border-orange-200" };
            case "RESOLVED": return { label: "Résolu", color: "text-green-600 bg-green-50 border-green-200" };
            case "CLOSED": return { label: "Clos", color: "text-slate-600 bg-slate-50 border-slate-200" };
            default: return { label: status, color: "text-slate-600 bg-slate-50" };
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                onClose();
                setActiveTab("new"); // reset
            }
        }}>
            <DialogContent className="sm:max-w-[550px] bg-card p-0 overflow-hidden border-2 border-slate-200 flex flex-col md:max-h-[85vh]">
                <div className="bg-slate-900 px-6 py-4 flex flex-col items-start min-h-[90px] shrink-0 justify-center">
                    <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="text-blue-500" />
                        Support IT & Signalements
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-sm mt-1">
                        Un bug ? Un blocage ? Notre équipe technique est là pour vous aider.
                    </DialogDescription>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                    <div className="px-6 pt-4 shrink-0">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                            <TabsTrigger value="new" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-bold">
                                <PlusCircle className="w-4 h-4 mr-2" /> Déclarer
                            </TabsTrigger>
                            <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-bold">
                                <History className="w-4 h-4 mr-2" /> Mes Demandes
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="new" className="flex-1 overflow-y-auto mt-0">
                        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
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

                            <div className="space-y-1.5">
                                <Label className="font-bold text-xs text-muted-foreground uppercase flex items-center justify-between w-full">
                                    <span>Capture d'écran (Optionnel)</span>
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

                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800 font-bold px-8" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Envoyer la demande
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    <TabsContent value="history" className="flex-1 overflow-y-auto mt-0 p-6 bg-slate-50/50">
                        {fetchingHistory ? (
                            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                                <span className="text-sm font-medium text-slate-500">Chargement de vos demandes...</span>
                            </div>
                        ) : myTickets.length === 0 ? (
                            <div className="text-center py-10 bg-white border border-slate-200 border-dashed rounded-xl">
                                <ShieldAlert className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-slate-600">Aucune demande informatique</p>
                                <p className="text-xs text-slate-400 mt-1">Vous n'avez déclaré aucun incident technique.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myTickets.map(ticket => {
                                    const { label, color } = getStatusTextAndColor(ticket.status);
                                    return (
                                        <div key={ticket.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-slate-800 text-sm max-w-[70%]">{ticket.subject}</h4>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${color}`}>
                                                    {label}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 mb-3 line-clamp-2">
                                                {ticket.description}
                                            </div>
                                            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                                                <span>Ticket #{ticket.id.slice(-6).toUpperCase()}</span>
                                                <span>{format(new Date(ticket.createdAt), "dd MMM yyyy", { locale: fr })}</span>
                                            </div>
                                            
                                            {/* Note de résolution de l'IT si elle existe */}
                                            {ticket.adminComment && (
                                                <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3 relative">
                                                    <div className="absolute top-0 left-4 -translate-y-1/2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                                        Retour de l'Équipe IT
                                                    </div>
                                                    <p className="text-xs text-slate-700 whitespace-pre-wrap pt-1 font-medium">
                                                        {ticket.adminComment}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
