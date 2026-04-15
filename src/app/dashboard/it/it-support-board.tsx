"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateTicketStatus } from "@/actions/it-support.actions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ListFilter, LayoutGrid, AlertTriangle, ShieldCheck, HardDrive, Link as LinkIcon, Image as ImageIcon, CheckCircle, Save, Search, MessageSquare, Clock, UserIcon, ArrowRight } from "lucide-react";
import { ITSupportKpi } from "./it-support-kpi";
import { Input } from "@/components/ui/input";

export function ITSupportBoard({ initialTickets }: { initialTickets: any[] }) {
    const [tickets, setTickets] = useState(initialTickets);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [tempComment, setTempComment] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

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
            t.user.firstName.toLowerCase().includes(q) ||
            t.user.lastName.toLowerCase().includes(q) ||
            t.id.slice(-6).toLowerCase().includes(q)
        );
    }

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
            case "OPEN": return <span className="text-blue-400 border border-blue-400/30 bg-blue-500/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">OUVERT</span>;
            case "IN_PROGRESS": return <span className="text-orange-400 border border-orange-400/30 bg-orange-500/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">EN COURS</span>;
            case "RESOLVED": return <span className="text-emerald-400 border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.2)]">RÉSOLU</span>;
            default: return <span className="text-slate-400 border border-slate-500/30 bg-slate-500/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">CLOS</span>;
        }
    };

    const parseDescriptionToTimeline = (desc: string) => {
        if (!desc) return [];
        const parts = desc.split('---').map(s => s.trim()).filter(Boolean);
        const original = parts[0];
        const timeline = [];
        
        timeline.push({ type: 'ORIGINAL', content: original });
        
        for (let i = 1; i < parts.length; i++) {
            const p = parts[i];
            if (p.startsWith('[RETOUR SALARIÉ')) {
                const match = p.match(/\[RETOUR SALARIÉ - (.*?)\] :\s*([\s\S]*)/);
                if (match) {
                    timeline.push({ type: 'RETOUR', date: match[1], content: match[2] });
                } else {
                    timeline.push({ type: 'RETOUR', content: p });
                }
            } else {
                timeline.push({ type: 'OTHER', content: p });
            }
        }
        return timeline;
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedTicket) return;
        const res = await updateTicketStatus(selectedTicket.id, newStatus as any, tempComment);
        if (res.success) {
            toast.success(`Le ticket est passé en ${newStatus}`);
            setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t));
            setSelectedTicket({ ...selectedTicket, status: newStatus });
        } else {
            toast.error(res.error);
        }
    };

    const handleCommentSave = async () => {
        if (!selectedTicket) return;
        setIsSaving(true);
        try {
            const res = await updateTicketStatus(selectedTicket.id, selectedTicket.status, tempComment);
            if (res.success) {
                toast.success(`Note interne sauvegardée avec succès`);
                setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, adminComment: tempComment } : t));
                setSelectedTicket({ ...selectedTicket, adminComment: tempComment });
            } else {
                toast.error(res.error);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const draggedTicketId = e.dataTransfer.getData("ticketId");
        if (!draggedTicketId) return;

        const ticket = tickets.find(t => t.id === draggedTicketId);
        if (ticket && ticket.status !== newStatus) {
            // Optimistic update
            setTickets(tickets.map(t => t.id === draggedTicketId ? { ...t, status: newStatus } : t));
            
            const res = await updateTicketStatus(draggedTicketId, newStatus as any, ticket.adminComment);
            if (res.success) {
                toast.success(`Le ticket est passé en ${newStatus}`);
            } else {
                toast.error(res.error);
                // Revert on failure
                setTickets(tickets); 
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    // VUE KANBAN
    const KanbanColumn = ({ title, statusId, icon: Icon, colorClass, tickets: colTickets }: any) => (
        <div 
            className="flex-1 min-w-[320px] bg-[#0B1120] rounded-2xl border border-slate-800 p-4 flex flex-col h-[65vh] shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] transition-colors data-[dragover=true]:bg-[#151e32]/50 data-[dragover=true]:border-slate-600"
            onDragOver={(e) => {
                handleDragOver(e);
                e.currentTarget.setAttribute('data-dragover', 'true');
            }}
            onDragLeave={(e) => e.currentTarget.removeAttribute('data-dragover')}
            onDrop={(e) => {
                e.currentTarget.removeAttribute('data-dragover');
                handleDrop(e, statusId);
            }}
        >
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
                <h3 className={`font-black uppercase tracking-widest text-xs flex items-center gap-2 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                    {title}
                </h3>
                <span className="bg-slate-800 text-slate-300 text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm border border-slate-700">
                    {colTickets.length}
                </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {colTickets.map((t: any) => (
                    <div 
                        key={t.id} 
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.setData("ticketId", t.id);
                            e.dataTransfer.effectAllowed = "move";
                        }}
                        onClick={() => {
                            setSelectedTicket(t);
                            setTempComment(t.adminComment || "");
                        }}
                        className="bg-[#151e32] border border-slate-700 p-5 rounded-xl shadow-lg hover:shadow-cyan-900/20 hover:border-blue-500/50 transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-blue-500 transition-colors"></div>
                        
                        <div className="flex justify-between items-start mb-3 gap-2">
                            {getUrgencyBadge(t.urgency)}
                            <span className="text-[10px] text-slate-500 font-bold bg-[#0B1120] px-2 py-0.5 rounded border border-slate-800">#{t.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-200 line-clamp-2 leading-snug mb-3 group-hover:text-white transition-colors">
                            {t.subject}
                        </h4>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-2">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 uppercase rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-black text-slate-300">
                                    {t.user.firstName[0]}{t.user.lastName[0]}
                                </div>
                                <span className="text-[11px] font-medium text-slate-400">{t.user.firstName}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">
                                {format(new Date(t.createdAt), "dd MMM HH:mm", { locale: fr })}
                            </span>
                        </div>
                    </div>
                ))}
                {colTickets.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                        <span className="text-slate-600 text-xs font-bold uppercase tracking-widest italic opacity-50">Aucun ticket</span>
                    </div>
                )}
            </div>
        </div>
    );

    // VUE TABLE
    const TableView = () => (
        <div className="bg-[#0B1120] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <table className="w-full text-sm text-left">
                <thead className="bg-[#151e32] text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
                    <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Urgence</th>
                        <th className="px-6 py-4 w-1/3">Sujet</th>
                        <th className="px-6 py-4">Déclaré par</th>
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
                                setTempComment(t.adminComment || "");
                            }} 
                            className="hover:bg-[#1e293b] transition-colors cursor-pointer group"
                        >
                            <td className="px-6 py-4 font-mono text-[11px] font-bold text-slate-500 group-hover:text-blue-400 transition-colors">#{t.id.slice(-6).toUpperCase()}</td>
                            <td className="px-6 py-4">{getUrgencyBadge(t.urgency)}</td>
                            <td className="px-6 py-4 font-bold text-slate-300 group-hover:text-white transition-colors">{t.subject}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-7 w-7 uppercase rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-300">
                                        {t.user.firstName[0]}{t.user.lastName[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-xs text-slate-300">{t.user.firstName} {t.user.lastName}</span>
                                        <span className="text-[9px] uppercase font-bold text-slate-500">{(t.user.roles || []).join(', ')}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-500">{format(new Date(t.createdAt), "dd/MM/yy HH:mm", { locale: fr })}</td>
                            <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div>
            <ITSupportKpi 
                tickets={tickets} 
                activeFilter={activeFilter} 
                onFilterChange={setActiveFilter} 
            />

            <Tabs defaultValue="table" className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <TabsList className="bg-[#0B1120] border border-slate-800 p-1 rounded-xl">
                        <TabsTrigger value="table" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white text-slate-400 font-bold text-xs rounded-lg px-4 py-2">
                            <ListFilter className="h-4 w-4 mr-2" /> VUE LISTE
                        </TabsTrigger>
                        <TabsTrigger value="kanban" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white text-slate-400 font-bold text-xs rounded-lg px-4 py-2">
                            <LayoutGrid className="h-4 w-4 mr-2" /> VUE KANBAN
                        </TabsTrigger>
                    </TabsList>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher (ex: #8IN5GP, problème...)"
                            className="bg-[#0B1120] border-slate-800 text-slate-200 placeholder:text-slate-600 pl-10 focus-visible:ring-blue-500/50"
                        />
                    </div>
                </div>

                <TabsContent value="kanban" className="mt-0">
                    <div className="flex gap-5 overflow-x-auto pb-4">
                        <KanbanColumn title="Nouveaux & Ouverts" statusId="OPEN" icon={AlertTriangle} colorClass="text-blue-400" tickets={filteredTickets.filter((t: any) => t.status === "OPEN")} />
                        <KanbanColumn title="En Cours d'analyse" statusId="IN_PROGRESS" icon={HardDrive} colorClass="text-orange-400" tickets={filteredTickets.filter((t: any) => t.status === "IN_PROGRESS")} />
                        <KanbanColumn title="Résolus & Clôturés" statusId="RESOLVED" icon={ShieldCheck} colorClass="text-emerald-400" tickets={filteredTickets.filter((t: any) => t.status === "RESOLVED" || t.status === "CLOSED")} />
                    </div>
                </TabsContent>

                <TabsContent value="table" className="mt-0">
                    <TableView />
                </TabsContent>
            </Tabs>

            {/* TICKET DETAILS MODAL (PREMIUM HIGH-TECH) */}
            {selectedTicket && (
                <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                    <DialogContent className="sm:max-w-5xl lg:max-w-6xl w-full bg-[#0a0f1c] p-0 overflow-hidden border border-slate-800 shadow-[0_0_80px_rgba(0,100,255,0.05)]">
                        <div className="bg-[#0f172a]/90 backdrop-blur-xl px-8 py-6 flex justify-between items-start border-b border-slate-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                            
                            <div className="space-y-3 w-full pr-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    {getUrgencyBadge(selectedTicket.urgency)}
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-md border border-slate-800">
                                        INCIDENT #{selectedTicket.id.slice(-8).toUpperCase()}
                                    </span>
                                </div>
                                <DialogTitle className="text-3xl font-black text-white tracking-tight leading-tight">{selectedTicket.subject}</DialogTitle>
                                <DialogDescription className="text-sm font-bold text-slate-400 flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-blue-400" />
                                    Créé le {format(new Date(selectedTicket.createdAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row h-[75vh] 2xl:h-[80vh]">
                            
                            {/* LEFT COLUMN : INTERACTIVE TIMELINE */}
                            <div className="flex-1 border-r border-slate-800 overflow-y-auto bg-[#0B1120] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                                <div className="p-8 space-y-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-0.5 w-8 bg-blue-500 rounded"></div>
                                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Chronologie de l'incident</h4>
                                    </div>
                                    
                                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-slate-700 before:to-transparent">
                                        
                                        {parseDescriptionToTimeline(selectedTicket.description).map((item, idx) => (
                                            <div key={idx} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                {/* Écrou de timeline */}
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#0B1120] bg-slate-800 text-slate-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_0_2px_rgba(59,130,246,0.2)] z-10 transition-transform group-hover:scale-110">
                                                    {item.type === 'ORIGINAL' ? <AlertTriangle className="w-4 h-4 text-blue-400" /> : <MessageSquare className="w-4 h-4 text-orange-400" />}
                                                </div>
                                                
                                                {/* Carte contenu */}
                                                <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#151e32] border border-slate-700/60 p-5 rounded-2xl shadow-xl transition-all hover:border-slate-500 hover:shadow-2xl ${item.type === 'ORIGINAL' ? 'hover:shadow-blue-900/20' : 'hover:shadow-orange-900/20'}`}>
                                                    <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                        {item.type === 'ORIGINAL' ? (
                                                            <div className="flex items-center gap-2 text-blue-400">
                                                                <UserIcon className="w-3 h-3" /> Déclaration initiale
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-orange-400">
                                                                <ArrowRight className="w-3 h-3" /> Retour Salarié
                                                            </div>
                                                        )}
                                                        {item.date && <span>{item.date}</span>}
                                                    </div>
                                                    <div className="text-slate-300 whitespace-pre-wrap font-medium leading-relaxed text-sm">
                                                        {item.content}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                    </div>

                                    {selectedTicket.pageUrl && (
                                        <div className="mt-8 flex justify-center">
                                            <a href={selectedTicket.pageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-[#0a0f1c] bg-blue-500 px-6 py-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:bg-blue-400 hover:scale-105 transition-all">
                                                <LinkIcon className="h-5 w-5" />
                                                Accéder à l'URL Signalée
                                            </a>
                                        </div>
                                    )}

                                    {selectedTicket.imageUrl && (
                                        <div className="mt-10 border-t border-slate-800 pt-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="h-0.5 w-8 bg-slate-600 rounded"></div>
                                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                    <ImageIcon className="h-4 w-4" /> Analyse Visuelle (Capture)
                                                </h4>
                                            </div>
                                            <a href={selectedTicket.imageUrl} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-2xl border border-slate-700 bg-black">
                                                <img src={selectedTicket.imageUrl} className="w-full object-contain opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500" alt="Capture d'écran jointe" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-white font-bold text-sm tracking-widest uppercase flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
                                                        <Search className="w-4 h-4" /> Agrandir
                                                    </span>
                                                </div>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT COLUMN : ACTION CENTER */}
                            <div className="w-full md:w-[400px] bg-[#0f172a] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col z-20">
                                <div className="p-8 border-b border-slate-800">
                                    <Label className="text-xs text-slate-400 font-black tracking-widest uppercase block mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                        État du Système
                                    </Label>
                                    <Select value={selectedTicket.status} onValueChange={handleStatusChange}>
                                        <SelectTrigger className="w-full h-14 bg-[#0B1120] border-slate-700 text-white font-black text-sm tracking-widest uppercase shadow-inner hover:border-slate-500 transition-colors">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                                            <SelectItem value="OPEN" className="font-bold py-3">🔴 Ouvert</SelectItem>
                                            <SelectItem value="IN_PROGRESS" className="font-bold py-3">🟠 En Cours d'analyse</SelectItem>
                                            <SelectItem value="RESOLVED" className="font-bold py-3">🟢 Résolu (En attente confirmation)</SelectItem>
                                            <SelectItem value="CLOSED" className="font-bold py-3">⚪ Fermé et Archivé</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="p-8 border-b border-slate-800 bg-[#151e32]/30">
                                    <Label className="text-xs text-slate-400 font-black tracking-widest uppercase block mb-6">Identification Salarié</Label>
                                    <div className="flex items-center gap-4 bg-[#0a0f1c] p-4 rounded-2xl border border-slate-800/50 shadow-inner">
                                        <div className="h-14 w-14 uppercase rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-slate-600 flex items-center justify-center text-xl font-black text-white shadow-lg">
                                            {selectedTicket.user.firstName[0]}{selectedTicket.user.lastName[0]}
                                        </div>
                                        <div>
                                            <div className="font-black text-lg text-white">{selectedTicket.user.firstName} {selectedTicket.user.lastName}</div>
                                            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-1 flex flex-wrap gap-1">
                                                {(selectedTicket.user.roles || []).map((r: string) => (
                                                    <span key={r} className="bg-slate-800 px-2 py-0.5 rounded">{r}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col p-8 bg-gradient-to-b from-transparent to-[#0B1120]">
                                    <Label className="text-xs text-slate-400 font-black tracking-widest uppercase block mb-4 flex items-center justify-between">
                                        Terminal de Résolution
                                        <span className="text-[10px] text-blue-400 font-medium normal-case bg-blue-500/10 px-2 py-1 rounded">Visible par le salarié</span>
                                    </Label>
                                    <div className="relative flex-1 flex flex-col">
                                        <Textarea 
                                            className="flex-1 bg-[#0a0f1c] border-slate-700 text-green-400 text-sm p-5 rounded-2xl rounded-b-none focus-visible:ring-1 focus-visible:ring-blue-500 placeholder:text-slate-700 font-mono resize-none shadow-inner" 
                                            placeholder="> Rédigez le log de résolution technique ici..."
                                            value={tempComment}
                                            onChange={(e) => setTempComment(e.target.value)}
                                            maxLength={2000}
                                        />
                                        <div className="bg-[#1e293b] border border-slate-700 border-t-0 p-3 rounded-b-2xl flex justify-between items-center shadow-lg">
                                            <span className="text-[10px] font-mono font-bold text-slate-500 px-2">BYTES: {tempComment.length}/2000</span>
                                            <Button 
                                                className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs px-6 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all"
                                                onClick={handleCommentSave}
                                                disabled={isSaving}
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                Commit
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
