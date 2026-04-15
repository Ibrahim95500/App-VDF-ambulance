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
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ListFilter, LayoutGrid, AlertTriangle, ShieldCheck, HardDrive, Link as LinkIcon, Image as ImageIcon, CheckCircle, Save } from "lucide-react";

export function ITSupportBoard({ initialTickets }: { initialTickets: any[] }) {
    const [tickets, setTickets] = useState(initialTickets);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [tempComment, setTempComment] = useState("");
    const [isSaving, setIsSaving] = useState(false);

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
            case "RESOLVED": return <span className="text-emerald-400 border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">RÉSOLU</span>;
            default: return <span className="text-slate-400 border border-slate-500/30 bg-slate-500/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">CLOS</span>;
        }
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

    // VUE KANBAN
    const KanbanColumn = ({ title, statusId, icon: Icon, colorClass, tickets: colTickets }: any) => (
        <div className="flex-1 min-w-[320px] bg-[#0B1120] rounded-2xl border border-slate-800 p-4 flex flex-col h-[65vh] shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)]">
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
                        onClick={() => {
                            setSelectedTicket(t);
                            setTempComment(t.adminComment || "");
                        }}
                        className="bg-[#151e32] border border-slate-700 p-5 rounded-xl shadow-lg hover:shadow-cyan-900/20 hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden"
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
                    {tickets.map(t => (
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
            <Tabs defaultValue="kanban" className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-[#0B1120] border border-slate-800 p-1 rounded-xl">
                        <TabsTrigger value="kanban" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white text-slate-400 font-bold text-xs rounded-lg px-4 py-2">
                            <LayoutGrid className="h-4 w-4 mr-2" /> VUE KANBAN
                        </TabsTrigger>
                        <TabsTrigger value="table" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white text-slate-400 font-bold text-xs rounded-lg px-4 py-2">
                            <ListFilter className="h-4 w-4 mr-2" /> VUE LISTE
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="kanban" className="mt-0">
                    <div className="flex gap-5 overflow-x-auto pb-4">
                        <KanbanColumn title="Nouveaux & Ouverts" statusId="OPEN" icon={AlertTriangle} colorClass="text-blue-400" tickets={tickets.filter(t => t.status === "OPEN")} />
                        <KanbanColumn title="En Cours d'analyse" statusId="IN_PROGRESS" icon={HardDrive} colorClass="text-orange-400" tickets={tickets.filter(t => t.status === "IN_PROGRESS")} />
                        <KanbanColumn title="Résolus & Clôturés" statusId="RESOLVED" icon={ShieldCheck} colorClass="text-emerald-400" tickets={tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED")} />
                    </div>
                </TabsContent>

                <TabsContent value="table" className="mt-0">
                    <TableView />
                </TabsContent>
            </Tabs>

            {/* TICKET DETAILS MODAL (PREMIUM DARK) */}
            {selectedTicket && (
                <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                    <DialogContent className="sm:max-w-[750px] bg-[#0f172a] p-0 overflow-hidden border border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                        <div className="bg-[#0B1120] px-6 py-5 flex justify-between items-start border-b border-slate-800">
                            <div className="space-y-2 w-full pr-8">
                                <div className="flex items-center gap-3 mb-1">
                                    {getUrgencyBadge(selectedTicket.urgency)}
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-auto">
                                        ID #{selectedTicket.id.slice(-6).toUpperCase()}
                                    </span>
                                </div>
                                <DialogTitle className="text-xl font-bold text-white tracking-tight">{selectedTicket.subject}</DialogTitle>
                                <DialogDescription className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                                    Signalé le {format(new Date(selectedTicket.createdAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-8 min-h-[50vh] max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            
                            {/* COLONNE GAUCHE : INFOS DU TICKET */}
                            <div className="md:col-span-2 space-y-6">
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-1 w-4 bg-slate-600 rounded"></div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Description détaillée</h4>
                                    </div>
                                    <div className="bg-[#1e293b]/50 p-5 rounded-xl border border-slate-700/50 shadow-inner text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                        {selectedTicket.description}
                                    </div>
                                    {selectedTicket.pageUrl && (
                                        <a href={selectedTicket.pageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-4 text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-4 py-2.5 rounded-lg border border-blue-500/30 hover:bg-blue-500/20 hover:text-blue-300 transition-colors w-max">
                                            <LinkIcon className="h-4 w-4" />
                                            Ouvrir l'URL signalée
                                        </a>
                                    )}
                                </section>

                                {selectedTicket.imageUrl && (
                                    <section>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-1 w-4 bg-slate-600 rounded"></div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <ImageIcon className="h-4 w-4" /> Pièce jointe
                                            </h4>
                                        </div>
                                        <div className="bg-[#1e293b]/50 p-2 rounded-xl border border-slate-700/50 flex justify-center">
                                            <a href={selectedTicket.imageUrl} target="_blank" rel="noreferrer">
                                                <img src={selectedTicket.imageUrl} className="max-w-full max-h-[300px] rounded-lg border border-slate-800 shadow-md hover:scale-[1.02] transition-transform cursor-pointer" alt="Capture jointe" />
                                            </a>
                                        </div>
                                    </section>
                                )}
                            </div>

                            {/* COLONNE DROITE : ACTIONS ET INFOS INTERNES */}
                            <div className="space-y-6">
                                <section className="bg-[#1e293b] p-5 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
                                    {/* Subtils effets lumineux */}
                                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-blue-500/20 blur-3xl rounded-full"></div>
                                    
                                    <div className="relative z-10 space-y-5">
                                        <div>
                                            <Label className="text-[10px] text-slate-400 font-black tracking-widest uppercase block mb-2">Changer le Statut</Label>
                                            <Select value={selectedTicket.status} onValueChange={handleStatusChange}>
                                                <SelectTrigger className="w-full bg-[#0f172a] border-slate-600 text-white font-bold shadow-inner">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                                                    <SelectItem value="OPEN" className="font-bold focus:bg-slate-700 focus:text-white">Ouvert</SelectItem>
                                                    <SelectItem value="IN_PROGRESS" className="font-bold focus:bg-slate-700 focus:text-white">En Cours</SelectItem>
                                                    <SelectItem value="RESOLVED" className="font-bold focus:bg-slate-700 focus:text-white">Résolu</SelectItem>
                                                    <SelectItem value="CLOSED" className="font-bold focus:bg-slate-700 focus:text-white">Fermé (Archivé)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="pt-5 border-t border-slate-700/50">
                                            <Label className="text-[10px] text-slate-400 font-black tracking-widest uppercase block mb-3">Déclaré par</Label>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 uppercase rounded-full bg-[#0f172a] border-2 border-slate-600 flex items-center justify-center text-sm font-black text-white shadow-inner">
                                                    {selectedTicket.user.firstName[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-slate-200">{selectedTicket.user.firstName} {selectedTicket.user.lastName}</div>
                                                    <div className="text-[9px] uppercase font-black tracking-widest text-slate-500 mt-0.5">
                                                        {(selectedTicket.user.roles || []).join(', ')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="flex flex-col h-full">
                                    <Label className="text-[10px] text-slate-400 font-black tracking-widest uppercase block mb-2 flex items-center justify-between">
                                        Note Interne IT
                                        <span className="text-[9px] text-slate-500 font-normal normal-case">Visible par le salarié en "Résolu"</span>
                                    </Label>
                                    <Textarea 
                                        className="bg-[#1e293b] border-slate-700 border-b-0 text-slate-300 text-sm h-32 rounded-t-xl rounded-b-none focus-visible:ring-1 focus-visible:ring-blue-500 placeholder:text-slate-600 resize-none font-medium" 
                                        placeholder="Écrivez votre rapport de résolution..."
                                        value={tempComment}
                                        onChange={(e) => setTempComment(e.target.value)}
                                        maxLength={2000}
                                    />
                                    <div className="bg-[#0f172a] border border-slate-700 border-t-0 p-2 rounded-b-xl flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-slate-500 px-2">{tempComment.length} / 2000</span>
                                        <Button 
                                            size="sm" 
                                            className="h-7 text-[10px] font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all"
                                            onClick={handleCommentSave}
                                            disabled={isSaving}
                                        >
                                            <Save className="w-3 h-3 mr-1.5" />
                                            Enregistrer
                                        </Button>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
