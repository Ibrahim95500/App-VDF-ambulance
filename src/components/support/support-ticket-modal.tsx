"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, X, ShieldAlert, PlusCircle, History, Search, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { salarieUpdateTicketStatus } from "@/actions/it-support.actions";

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

    // Form
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [urgency, setUrgency] = useState("MEDIUM");
    const [category, setCategory] = useState("OTHER");
    const [imageStr, setImageStr] = useState<string | null>(null);

    // List View Features
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 2;

    // Detail View Feature
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (isOpen && activeTab === "history") {
            fetchMyTickets();
            const interval = setInterval(fetchMyTickets, 5000); // Polling toutes les 5s dans l'historique
            return () => clearInterval(interval);
        }
    }, [isOpen, activeTab]);

    const fetchMyTickets = async () => {
        if (!selectedTicket) setFetchingHistory(true); // Seulement le skeleton lors du premier chargement global
        try {
            const res = await fetch("/api/support/ticket");
            const data = await res.json();
            if (res.ok) {
                setMyTickets(data);
                
                // Mettre à jour le selectedTicket en temps réel s'il est ouvert
                if (selectedTicket) {
                    const updated = data.find((t: any) => t.id === selectedTicket.id);
                    if (updated) setSelectedTicket(updated);
                }
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

    const handleStatusAction = async (newStatus: "CLOSED" | "IN_PROGRESS", promptMessage?: string) => {
        if (!selectedTicket) return;
        
        let comment = undefined;
        if (newStatus === "IN_PROGRESS") {
            const userComment = window.prompt("Pouvez-vous préciser ce qui ne fonctionne toujours pas ?");
            if (userComment === null) return; // Annule l'action si on ferme le prompt
            comment = userComment;
        }

        try {
            setActionLoading(true);
            const res = await salarieUpdateTicketStatus(selectedTicket.id, newStatus, comment);
            if (res.error) throw new Error(res.error);

            toast.success(newStatus === "CLOSED" ? "L'incident a été clôturé." : "Le support a été relancé !");
            await fetchMyTickets(); // Rafraîchir pour voir les changements
        } catch (e: any) {
            toast.error(e.message || "Erreur lors de la mise à jour");
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusTextAndColor = (status: string) => {
        switch (status) {
            case "OPEN": return { label: "Nouveau", color: "text-blue-600 bg-blue-50 border-blue-200" };
            case "IN_PROGRESS": return { label: "En cours", color: "text-orange-600 bg-orange-50 border-orange-200" };
            case "RESOLVED": return { label: "À Confirmer", color: "text-green-600 bg-green-50 border-green-200" };
            case "CLOSED": return { label: "Clos", color: "text-slate-600 bg-slate-50 border-slate-200" };
            default: return { label: status, color: "text-slate-600 bg-slate-50" };
        }
    };

    // Filter and Pagination Logic
    const filteredTickets = useMemo(() => {
        if (!searchQuery.trim()) return myTickets;
        const q = searchQuery.toLowerCase();
        return myTickets.filter(t => 
            t.subject.toLowerCase().includes(q) || 
            t.id.toLowerCase().includes(q)
        );
    }, [myTickets, searchQuery]);

    const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
    const currentTickets = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTickets, currentPage]);

    // Handle bad page index if filter changed
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const hasResolvedNeedAction = myTickets.some(t => t.status === "RESOLVED");

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                onClose();
                setActiveTab("new"); // reset
                setSelectedTicket(null);
            }
        }}>
            <DialogContent className="sm:max-w-[550px] bg-card p-0 overflow-hidden border-2 border-slate-200 flex flex-col md:max-h-[85vh] h-[90vh] md:h-auto">
                <div className="bg-slate-900 px-6 py-4 flex flex-col items-start min-h-[90px] shrink-0 justify-center relative">
                    {/* Return back from detail view */}
                    {activeTab === "history" && selectedTicket && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-4 right-12 text-slate-400 hover:text-white"
                            onClick={() => setSelectedTicket(null)}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="text-blue-500" />
                        Support IT & Signalements
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-sm mt-1">
                        Un bug ? Un blocage ? Notre équipe technique est là pour vous aider.
                    </DialogDescription>
                </div>

                <Tabs value={activeTab} onValueChange={(val) => {
                    setActiveTab(val);
                    if (val === "new") setSelectedTicket(null); // Reset détail si retour sur déclater
                }} className="flex-1 overflow-hidden flex flex-col">
                    <div className="px-6 pt-4 shrink-0">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                            <TabsTrigger value="new" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-bold">
                                <PlusCircle className="w-4 h-4 mr-2" /> Déclarer
                            </TabsTrigger>
                            <TabsTrigger value="history" className="relative data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-bold">
                                <History className="w-4 h-4 mr-2" /> Mes Demandes
                                {hasResolvedNeedAction && (
                                    <span className="absolute top-1.5 right-2 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                )}
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

                    <TabsContent value="history" className="flex-1 flex flex-col mt-0 h-full">
                        {/* Vue Liste */}
                        {!selectedTicket && (
                            <div className="flex flex-col h-full bg-slate-50/50">
                                <div className="px-6 py-4 border-b border-slate-100 bg-white">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input 
                                            placeholder="Rechercher (Titre, ou ID: Cuid123...)" 
                                            className="pl-9 h-9 text-xs"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {fetchingHistory && myTickets.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                                        </div>
                                    ) : currentTickets.length === 0 ? (
                                        <div className="text-center py-10 bg-white border border-slate-200 border-dashed rounded-xl">
                                            <ShieldAlert className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-slate-600">Aucune demande trouvée</p>
                                        </div>
                                    ) : (
                                        currentTickets.map(ticket => {
                                            const { label, color } = getStatusTextAndColor(ticket.status);
                                            return (
                                                <div 
                                                    key={ticket.id} 
                                                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative cursor-pointer hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.98]"
                                                    onClick={() => setSelectedTicket(ticket)}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-slate-800 text-sm max-w-[70%] line-clamp-1">{ticket.subject}</h4>
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${color}`}>
                                                            {label}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 mb-3 line-clamp-2">
                                                        {ticket.description}
                                                    </div>
                                                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                                                        <span>ID: #{ticket.id.slice(-6).toUpperCase()}</span>
                                                        <span>{format(new Date(ticket.createdAt), "dd MMM yyyy", { locale: fr })}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="px-6 py-3 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
                                        </Button>
                                        <span className="text-xs font-medium text-slate-500 text-center">
                                            Page {currentPage} / {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Suivant <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Vue Détaillée */}
                        {selectedTicket && (
                            <div className="flex flex-col h-full bg-slate-50 relative overflow-y-auto">
                                <div className="p-6">
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${getStatusTextAndColor(selectedTicket.status).color}`}>
                                                {getStatusTextAndColor(selectedTicket.status).label}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                ID: #{selectedTicket.id.slice(-8).toUpperCase()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 mt-2">{selectedTicket.subject}</h3>
                                        <div className="text-xs text-slate-400 mt-1">
                                            Déclaré le {format(new Date(selectedTicket.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                        </div>
                                    </div>

                                    {/* Description Initiale */}
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4">
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                                        {selectedTicket.imageUrl && (
                                            <div className="mt-4 border border-slate-100 rounded-lg overflow-hidden">
                                                <img src={selectedTicket.imageUrl} alt="Pièce jointe" className="w-full h-auto object-contain max-h-60" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Retour IT */}
                                    {selectedTicket.adminComment && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm relative mt-6 mb-4">
                                            <div className="absolute top-0 left-4 -translate-y-1/2 bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Équipe IT
                                            </div>
                                            <p className="text-sm text-slate-800 whitespace-pre-wrap mt-2">{selectedTicket.adminComment}</p>
                                        </div>
                                    )}

                                    {/* Actions si RESOLVED */}
                                    {selectedTicket.status === "RESOLVED" && (
                                        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-5 shadow-inner text-center">
                                            <h4 className="text-sm font-bold text-slate-800 mb-1">Avez-vous vérifié la solution ?</h4>
                                            <p className="text-xs text-slate-500 mb-4">L'équipe IT indique avoir résolu le problème. Merci d'infirmer ou confirmer.</p>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Button 
                                                    variant="outline" 
                                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full"
                                                    disabled={actionLoading}
                                                    onClick={() => handleStatusAction("IN_PROGRESS")}
                                                >
                                                    ❌ Ça marche toujours pas
                                                </Button>
                                                <Button 
                                                    className="bg-green-600 hover:bg-green-700 text-white border border-green-700 shadow flex items-center justify-center gap-2 w-full"
                                                    disabled={actionLoading}
                                                    onClick={() => handleStatusAction("CLOSED")}
                                                >
                                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "✅ Ça remarche ! (Fermer)"}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
