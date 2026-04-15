"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { salarieUpdateTicketStatus } from "@/actions/it-support.actions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ListFilter, LayoutGrid, AlertTriangle, ShieldCheck, HardDrive, Link as LinkIcon, Image as ImageIcon, CheckCircle, Search, MessageSquare, Clock, UserIcon, ArrowRight, PlusCircle, Loader2, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ITSupportKpi as UserSupportKpi } from "./user-support-kpi";

export function UserSupportBoard({ initialTickets }: { initialTickets: any[] }) {
    const [tickets, setTickets] = useState(initialTickets);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [tempComment, setTempComment] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [feedbackImageStr, setFeedbackImageStr] = useState<string | null>(null);
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
    
    // Create new ticket state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [urgency, setUrgency] = useState("MEDIUM");
    const [category, setCategory] = useState("OTHER");
    const [imageStr, setImageStr] = useState<string | null>(null);
    const [loadingCreate, setLoadingCreate] = useState(false);

    // Filter state
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

    let filteredTickets = activeFilter 
        ? tickets.filter(t => 
            activeFilter === "CRITICAL" ? (t.urgency === "CRITICAL" && t.status !== "CLOSED" && t.status !== "RESOLVED") : t.status === activeFilter
          )
        : tickets;

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filteredTickets = filteredTickets.filter(t => 
            t.id.toLowerCase().includes(q) || 
            t.subject.toLowerCase().includes(q) || 
            t.id.slice(-6).toLowerCase().includes(q)
        );
    }

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

    const handleFeedbackImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            setFeedbackImageStr(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!subject.trim() || !description.trim()) {
            toast.error("Veuillez remplir le sujet et la description.");
            return;
        }

        try {
            setLoadingCreate(true);
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
            
            // Add to ticket list
            setTickets([data, ...tickets]);
            
            setSubject("");
            setDescription("");
            setImageStr(null);
            setUrgency("MEDIUM");
            setCategory("OTHER");
            setIsCreateModalOpen(false);
        } catch (error) {
            toast.error("Erreur réseau");
        } finally {
            setLoadingCreate(false);
        }
    };

    const getUrgencyBadge = (urg: string) => {
        switch (urg) {
            case "CRITICAL": return <span className="bg-red-500/10 text-red-500 border border-red-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)]">CRITIQUE</span>;
            case "HIGH": return <span className="bg-orange-500/10 text-orange-500 border border-orange-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest">HAUTE</span>;
            case "MEDIUM": return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest">MOYENNE</span>;
            default: return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest">BASSE</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "OPEN": return <span className="text-blue-400 border border-blue-400/30 bg-blue-500/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">NOUVEAU</span>;
            case "IN_PROGRESS": return <span className="text-orange-400 border border-orange-400/30 bg-orange-500/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">EN COURS</span>;
            case "RESOLVED": return <span className="text-emerald-400 border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.2)]">À CONFIRMER</span>;
            default: return <span className="text-slate-400 border border-slate-500/30 bg-slate-500/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">CLOS</span>;
        }
    };

    const parseTimelineItem = (type: string, dateStr: string | undefined, contentWithImage: string) => {
        let content = contentWithImage;
        let image = null;
        if (content.includes('[IMAGE_ATTACHED]:')) {
            const parts = content.split('[IMAGE_ATTACHED]:');
            content = parts[0].trim();
            image = parts[1].trim();
        }
        return { type, date: dateStr, content, image };
    };

    const parseDescriptionToTimeline = (desc: string) => {
        if (!desc) return [];
        const parts = desc.split('---').map(s => s.trim()).filter(Boolean);
        const original = parts[0];
        const timeline = [];
        
        timeline.push({ type: 'ORIGINAL', content: original, date: undefined, image: null });
        
        for (let i = 1; i < parts.length; i++) {
            const p = parts[i];
            if (p.startsWith('[RETOUR SALARIÉ')) {
                const match = p.match(/\[RETOUR SALARIÉ - (.*?)\] :\s*([\s\S]*)/);
                if (match) {
                    timeline.push(parseTimelineItem('SALARIE', match[1], match[2]));
                } else {
                    timeline.push(parseTimelineItem('SALARIE', undefined, p));
                }
            } else if (p.startsWith('[RETOUR SUPPORT IT')) {
                const match = p.match(/\[RETOUR SUPPORT IT - (.*?)\] :\s*([\s\S]*)/);
                if (match) {
                    timeline.push(parseTimelineItem('IT', match[1], match[2]));
                } else {
                    timeline.push(parseTimelineItem('IT', undefined, p));
                }
            } else {
                timeline.push({ type: 'OTHER', content: p, date: undefined, image: null });
            }
        }
        return timeline;
    };

    const handleSalarieReply = async (isWorking: boolean) => {
        if (!selectedTicket) return;
        
        if (isWorking) {
            setIsSaving(true);
            try {
                // S'il clot le ticket
                const res = await salarieUpdateTicketStatus(selectedTicket.id, "CLOSED", "Le problème est résolu ! Merci.");
                if (res.error) throw new Error(res.error);
                
                toast.success("Incident clôturé !");
                setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, status: "CLOSED" } : t));
                setSelectedTicket({ ...selectedTicket, status: "CLOSED" });
                setTempComment("");
            } catch (e: any) {
                toast.error(e.message || "Erreur lors de la clôture");
            } finally {
                setIsSaving(false);
            }
        } else {
            // S'il signale que ça ne marche toujours pas (nécessite un commentaire !)
            if (!tempComment.trim()) {
                toast.error("Veuillez nous expliquer ce qui ne marche pas dans la zone de texte.");
                return;
            }

            setIsSaving(true);
            try {
                const res = await salarieUpdateTicketStatus(selectedTicket.id, "IN_PROGRESS", tempComment, feedbackImageStr || undefined);
                if (res.error) throw new Error(res.error);
                
                toast.success("Votre retour a été envoyé au support !");
                
                // Optimistic UI Update
                const dateStr = new Date().toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                let newDesc = selectedTicket.description + `\n\n--- \n[RETOUR SALARIÉ - ${dateStr}] :\n${tempComment}`;
                if (feedbackImageStr) {
                    newDesc += `\n[IMAGE_ATTACHED]:${feedbackImageStr}`;
                }
                
                const updatedTicket = { ...selectedTicket, description: newDesc, status: "IN_PROGRESS" };
                setSelectedTicket(updatedTicket);
                setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
                
                setTempComment("");
                setFeedbackImageStr(null);
            } catch (e: any) {
                toast.error(e.message || "Erreur lors de la mise à jour");
            } finally {
                setIsSaving(false);
            }
        }
    };

    // Columns
    const columns = [
        { id: "OPEN", title: "Nouveaux" },
        { id: "IN_PROGRESS", title: "En cours d'Analyse" },
        { id: "RESOLVED", title: "En Attente de Confirmation" },
        { id: "CLOSED", title: "Clos" }
    ];

    // VUE CARTES MOBILES (Responsive List)
    const MobileView = () => (
        <div className="md:hidden space-y-4 pb-12">
            {filteredTickets.map(t => (
                <div 
                    key={t.id} 
                    onClick={() => {
                        setSelectedTicket(t);
                        setTempComment("");
                    }} 
                    className="bg-[#0B1120] border border-slate-700 p-5 rounded-2xl shadow-xl flex flex-col gap-4 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-3 opacity-50">
                        {t.status === 'OPEN' && <AlertTriangle className="w-10 h-10 text-blue-500" />}
                        {t.status === 'IN_PROGRESS' && <HardDrive className="w-10 h-10 text-orange-500" />}
                        {t.status === 'RESOLVED' && <ShieldCheck className="w-10 h-10 text-emerald-500" />}
                    </div>
                    
                    <div className="flex items-center justify-between z-10">
                        {getUrgencyBadge(t.urgency)}
                        <span className="font-mono text-[10px] font-bold text-slate-500">#{t.id.slice(-6).toUpperCase()}</span>
                    </div>
                    
                    <h3 className="font-bold text-slate-200 text-sm leading-snug z-10">{t.subject}</h3>
                    
                    <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-1 z-10">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block mt-1">STATUT</span>
                        {getStatusBadge(t.status)}
                    </div>
                </div>
            ))}
            {filteredTickets.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-xs uppercase font-bold tracking-widest">
                    Aucun ticket trouvé.
                </div>
            )}
        </div>
    );

    // VUE TABLE
    const TableView = () => (
        <div className="hidden md:block bg-[#0B1120] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <table className="w-full text-sm text-left">
                <thead className="bg-[#151e32] text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
                    <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Urgence</th>
                        <th className="px-6 py-4 w-1/3">Sujet</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Statut</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {filteredTickets.map(t => (
                        <tr 
                            key={t.id} 
                            onClick={() => {
                                setSelectedTicket(t);
                                setTempComment("");
                            }} 
                            className="hover:bg-[#1e293b] transition-colors cursor-pointer group"
                        >
                            <td className="px-6 py-4 font-mono text-[11px] font-bold text-slate-500 group-hover:text-blue-400 transition-colors">#{t.id.slice(-6).toUpperCase()}</td>
                            <td className="px-6 py-4">{getUrgencyBadge(t.urgency)}</td>
                            <td className="px-6 py-4 font-bold text-slate-300 group-hover:text-white transition-colors">{t.subject}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-500">{format(new Date(t.createdAt), "dd/MM/yy HH:mm", { locale: fr })}</td>
                            <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-6">
            <UserSupportKpi 
                tickets={tickets} 
                activeFilter={activeFilter} 
                onFilterChange={setActiveFilter} 
            />

            <Tabs defaultValue="table" className="w-full">
                {/* Action Bar (Top Controls) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 font-bold"
                        >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Nouveau Ticket
                        </Button>
                        
                        <TabsList className="bg-[#0B1120] border border-slate-800 p-1 rounded-xl">
                            <TabsTrigger value="table" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white text-slate-400 font-bold text-xs rounded-lg px-4 py-2">
                                <ListFilter className="h-4 w-4 mr-2" /> VUE LISTE
                            </TabsTrigger>
                            <TabsTrigger value="kanban" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white text-slate-400 font-bold text-xs rounded-lg px-4 py-2">
                                <LayoutGrid className="h-4 w-4 mr-2" /> VUE KANBAN
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher (ex: #8IN5GP, problème...)"
                            className="bg-[#0B1120] border-slate-800 text-slate-200 placeholder:text-slate-600 pl-10 focus-visible:ring-blue-500/50 max-h-10"
                        />
                    </div>
                </div>

                <TabsContent value="kanban" className="mt-0">
                    <div className="flex flex-col md:flex-row gap-5 overflow-x-auto pb-4 snap-x sm:snap-none">
                        {columns.map(col => (
                            <div key={col.id} className="snap-center sm:min-w-[320px] flex-1 w-[85vw] sm:w-auto">
                                <div 
                                    className="bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden h-[65vh] shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)]"
                                >
                                    {/* Column Header */}
                                    <div className="p-4 border-b border-slate-800 bg-slate-900/40 shrink-0">
                                        <div className="flex items-center justify-between">
                                            <h2 className="font-exrabold text-sm text-slate-300 flex items-center gap-2 tracking-wide">
                                                {col.title}
                                                <Badge variant="secondary" className="bg-slate-800 text-slate-400 font-mono">
                                                    {filteredTickets.filter(t => t.status === col.id).length}
                                                </Badge>
                                            </h2>
                                        </div>
                                    </div>
                                    
                                    {/* Column Items */}
                                    <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-3 sm:space-y-4">
                                        {filteredTickets.filter(t => t.status === col.id).map(t => (
                                            <div 
                                                key={t.id}
                                                onClick={() => {
                                                    setSelectedTicket(t);
                                                    setTempComment(""); 
                                                }}
                                                className="bg-[#151e32] border border-slate-700 p-4 lg:p-5 rounded-xl shadow-lg hover:shadow-cyan-900/20 hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden"
                                            >
                                                {(t.urgency === "CRITICAL" || t.urgency === "HIGH") && (
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-2xl rounded-full" />
                                                )}
                                                <div className="flex justify-between items-start mb-3 relative z-10">
                                                    <Badge variant="outline" className="text-slate-500 border-slate-700/50 bg-[#0B1120] font-mono">
                                                        #{t.id.slice(-6).toUpperCase()}
                                                    </Badge>
                                                    {getUrgencyBadge(t.urgency)}
                                                </div>
                                                <h3 className="text-slate-200 font-bold text-[13px] lg:text-sm mb-4 line-clamp-2 leading-relaxed relative z-10">
                                                    {t.subject}
                                                </h3>
                                                <div className="flex items-center justify-between mt-auto border-t border-slate-700/50 pt-3 relative z-10">
                                                    <div className="flex items-center gap-2 text-slate-500 text-[10px] lg:text-xs">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {format(new Date(t.createdAt), "dd MMM à HH:mm", { locale: fr })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {filteredTickets.filter(t => t.status === col.id).length === 0 && (
                                            <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl">
                                                <span className="text-slate-600 text-sm font-medium">Vide</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="table" className="mt-0">
                    <MobileView />
                    <TableView />
                </TabsContent>
            </Tabs>

            {/* CREATE MODAL */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[550px] bg-card p-0 overflow-hidden border-2 border-slate-200">
                    <div className="bg-slate-900 px-6 py-4 flex flex-col items-start min-h-[90px] shrink-0 justify-center relative">
                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <PlusCircle className="text-blue-500 w-5 h-5" />
                            Nouveau Billet
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-sm mt-1">
                            Un bug ? Un blocage ? Notre équipe technique est là pour vous aider.
                        </DialogDescription>
                    </div>

                    <form onSubmit={handleCreateSubmit} className="px-6 py-4 space-y-5">
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

                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Annuler</Button>
                            <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800 font-bold px-8" disabled={loadingCreate}>
                                {loadingCreate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Envoyer
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DETAIL MODAL (TIMELINE & FEEDBACK) */}
            <Dialog open={!!selectedTicket} onOpenChange={(o) => !o && setSelectedTicket(null)}>
                {selectedTicket && (
                    <DialogContent className="max-w-[1000px] bg-[#0B1120] border border-slate-800 p-0 text-slate-200 overflow-hidden shadow-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col">
                        <div className="bg-slate-900 p-4 md:p-6 border-b border-slate-800 flex justify-between items-start shrink-0">
                            <div className="flex-1 mr-4">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    {getUrgencyBadge(selectedTicket.urgency)}
                                    <Badge variant="outline" className="border-slate-700 text-slate-400 bg-[#0B1120]">#{selectedTicket.id.slice(-6).toUpperCase()}</Badge>
                                </div>
                                <DialogTitle className="text-lg md:text-xl font-bold text-white line-clamp-2 md:line-clamp-1">{selectedTicket.subject}</DialogTitle>
                                <DialogDescription className="text-slate-400 flex items-center gap-2 mt-2 text-xs md:text-sm">
                                    <Clock className="w-4 h-4" />
                                    {format(new Date(selectedTicket.createdAt), "dd MMM yy à HH:mm", { locale: fr })}
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6 lg:gap-8">
                            <div className="w-full lg:w-2/3 flex flex-col">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <div className="w-6 h-px bg-slate-700"></div> Chronologie de l'incident
                                </h3>
                                {/* Timeline Wrapper - Removed max-height so it scrolls with the modal body natively */}
                                <div className="flex-1 pr-2 pb-6">
                                    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 md:before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-slate-700 before:to-transparent">
                                        
                                        {parseDescriptionToTimeline(selectedTicket.description).map((item, idx) => (
                                            <div key={idx} className={`relative flex items-start justify-between md:justify-normal ${item.type === 'SALARIE' ? 'md:flex-row-reverse' : ''} group is-active`}>
                                                <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border-4 border-[#0B1120] bg-slate-800 text-slate-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_0_2px_rgba(59,130,246,0.2)] z-10 transition-transform group-hover:scale-110">
                                                    {item.type === 'ORIGINAL' ? <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-blue-400" /> : item.type === 'IT' ? <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" /> : <MessageSquare className="w-3 h-3 md:w-4 md:h-4 text-orange-400" />}
                                                </div>
                                                
                                                <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-[#151e32] border border-slate-700/60 p-4 md:p-5 rounded-2xl shadow-xl transition-all hover:border-slate-500 hover:shadow-2xl ml-2 md:ml-0 ${item.type === 'ORIGINAL' ? 'hover:shadow-blue-900/20' : item.type === 'IT' ? 'hover:shadow-emerald-900/20 border-emerald-900/30' : 'hover:shadow-orange-900/20'}`}>
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider gap-2">
                                                        {item.type === 'ORIGINAL' ? (
                                                            <div className="flex items-center gap-2 text-blue-400">
                                                                <UserIcon className="w-3 h-3" /> Ma Demande Initiale
                                                            </div>
                                                        ) : item.type === 'IT' ? (
                                                            <div className="flex items-center gap-2 text-emerald-400">
                                                                <ShieldCheck className="w-3 h-3" /> Réponse IT
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-orange-400">
                                                                <ArrowRight className="w-3 h-3" /> Mon Retour
                                                            </div>
                                                        )}
                                                        {item.date && <span className="text-slate-500 font-mono opacity-80">{item.date}</span>}
                                                    </div>
                                                    <div className="text-slate-200 text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                                        {item.content}
                                                    </div>
                                                    {item.image && (
                                                        <div className="mt-3 overflow-hidden rounded-xl border border-slate-700/50 cursor-pointer group/img" onClick={() => setEnlargedImage(item.image as string)}>
                                                            <div className="relative">
                                                                <img src={item.image} alt="Capture jointe" className="w-full max-h-48 object-contain bg-black/40 group-hover/img:opacity-75 transition-opacity" />
                                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                                    <ImageIcon className="w-8 h-8 text-white drop-shadow-md" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {selectedTicket.pageUrl && selectedTicket.pageUrl.length > 5 && (
                                            <div className="relative flex items-center justify-center md:items-start group is-active mt-6">
                                                <div className="w-[calc(100%-3rem)] md:w-full flex justify-center ml-2 md:ml-0 z-10">
                                                    <a href={selectedTicket.pageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-105 active:scale-95 border border-blue-400">
                                                        <LinkIcon className="w-4 h-4" /> Accéder à l'URL signalée
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {selectedTicket.imageUrl && (
                                            <div className="relative flex items-center justify-center md:items-start group is-active mt-8">
                                                <div className="w-[calc(100%-3rem)] md:w-full flex-col flex items-center ml-2 md:ml-0 z-10">
                                                    <div className="flex items-center gap-3 mb-4 self-start md:self-center">
                                                        <div className="h-px w-8 bg-slate-600"></div>
                                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                            <ImageIcon className="h-3 w-3" /> Capture initiale
                                                        </h4>
                                                        <div className="h-px w-8 bg-slate-600"></div>
                                                    </div>
                                                    <div className="relative rounded-2xl border border-slate-700 bg-black cursor-pointer group/main border" onClick={() => setEnlargedImage(selectedTicket.imageUrl)}>
                                                        <img src={selectedTicket.imageUrl} className="w-full max-w-sm rounded-xl object-contain opacity-90 group-hover/main:opacity-100 group-hover/main:scale-105 transition-all duration-300" alt="Capture d'écran jointe" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/main:opacity-100 transition-opacity rounded-xl">
                                                            <span className="text-white font-bold text-xs tracking-widest uppercase flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                                                                <Search className="w-4 h-4" /> Agrandir
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="w-full lg:w-1/3 flex flex-col gap-6 lg:sticky lg:top-0 h-max pb-4">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shrink-0">
                                    <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div> État actuel
                                        </h3>
                                    </div>
                                    <div className="p-4 flex items-center gap-2">
                                        {getStatusBadge(selectedTicket.status)}
                                    </div>
                                </div>

                                {/* TERMINAL DE RETOUR (Feedback Salarié) */}
                                {selectedTicket.status !== "CLOSED" && (
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col min-h-[300px]">
                                        <div className="px-4 py-3 border-b border-slate-800 bg-[#0B1120] flex items-center justify-between">
                                            <h3 className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4 text-orange-400" /> Mon Retour
                                            </h3>
                                        </div>
                                        
                                        <div className="p-3 bg-[#0da349]/10 border-b border-green-900/30">
                                            <p className="text-xs text-green-500 font-bold text-center">
                                                Le problème est-il corrigé ?
                                            </p>
                                        </div>
                                        
                                        <div className="flex-1 p-3 bg-black flex flex-col justify-between relative font-mono group">
                                            <textarea 
                                                value={tempComment}
                                                onChange={e => setTempComment(e.target.value)}
                                                placeholder={"> Si non, précisez le problème ici avant de répondre..."}
                                                className="flex-1 bg-transparent text-green-500 resize-none outline-none text-[12px] sm:text-sm placeholder:text-green-900 selection:bg-green-500 selection:text-black py-2 custom-scrollbar focus:ring-0 w-full min-h-[80px]"
                                                spellCheck={false}
                                                disabled={isSaving}
                                            />
                                            {feedbackImageStr ? (
                                                <div className="mt-2 relative inline-block self-start">
                                                    <img src={feedbackImageStr} className="h-16 rounded-md border border-slate-700 object-contain" />
                                                    <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 w-5 h-5 rounded-full shadow-lg" onClick={() => setFeedbackImageStr(null)} type="button">
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="mt-2 pt-2 border-t border-green-900/30">
                                                    <label htmlFor="feedback-image" className="cursor-pointer inline-flex items-center gap-2 text-xs text-green-700 hover:text-green-500 transition-colors">
                                                        <ImageIcon className="w-4 h-4" /> Joindre une capture d'écran
                                                    </label>
                                                    <input id="feedback-image" type="file" accept="image/*" className="hidden" onChange={handleFeedbackImageUpload} />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="p-3 bg-[#0B1120] border-t border-slate-800 flex flex-col sm:flex-row gap-2 justify-between items-center z-10 shrink-0">
                                            <Button 
                                                onClick={() => handleSalarieReply(false)}
                                                disabled={isSaving || !tempComment.trim()}
                                                variant="outline"
                                                className="w-full sm:w-auto bg-slate-900 border-red-900/30 hover:border-red-500/50 text-red-400 hover:text-red-300 hover:bg-red-950 font-bold"
                                            >
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "❌ ÇA NE MARCHE PAS"}
                                            </Button>

                                            <Button 
                                                onClick={() => handleSalarieReply(true)}
                                                disabled={isSaving}
                                                className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-bold"
                                            >
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "✅ C'EST BON ! (Clôturer)"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                
                                {selectedTicket.status === "CLOSED" && (
                                    <div className="bg-emerald-900/20 border border-emerald-900/30 rounded-2xl overflow-hidden flex flex-col p-6 items-center justify-center text-center">
                                        <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
                                        <h3 className="text-emerald-400 font-bold mb-1">Ticket Clôturé</h3>
                                        <p className="text-slate-400 text-xs">Cet incident a été déclaré comme résolu et fermé.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>

            {/* LIGHTBOX POUR IMAGES */}
            <Dialog open={!!enlargedImage} onOpenChange={(o) => !o && setEnlargedImage(null)}>
                <DialogContent className="max-w-[95vw] h-[95vh] p-0 bg-black/95 border-none shadow-2xl flex items-center justify-center">
                    <DialogTitle className="sr-only">Zoom Image</DialogTitle>
                    <DialogDescription className="sr-only">Agrandissement de la capture d'écran associée au ticket.</DialogDescription>
                    <div className="relative w-full h-full flex items-center justify-center p-2">
                        {enlargedImage && (
                            <img src={enlargedImage} className="max-w-full max-h-full object-contain rounded-xl" alt="Image agrandie" />
                        )}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md z-50 rounded-full w-10 h-10"
                            onClick={() => setEnlargedImage(null)}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
