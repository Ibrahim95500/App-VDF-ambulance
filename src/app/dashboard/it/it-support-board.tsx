"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateTicketStatus } from "@/actions/it-support.actions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Search, ListFilter, LayoutGrid, Clock, AlertTriangle, ShieldCheck, HardDrive, Link as LinkIcon, Image as ImageIcon } from "lucide-react";

export function ITSupportBoard({ initialTickets }: { initialTickets: any[] }) {
    const [tickets, setTickets] = useState(initialTickets);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

    const getUrgencyBadge = (urg: string) => {
        switch (urg) {
            case "CRITICAL": return <Badge className="bg-red-600 hover:bg-red-700 animate-pulse">CRITIQUE</Badge>;
            case "HIGH": return <Badge className="bg-orange-500 hover:bg-orange-600">HAUTE</Badge>;
            case "MEDIUM": return <Badge className="bg-yellow-500 hover:bg-yellow-600">MOYENNE</Badge>;
            default: return <Badge className="bg-slate-500 hover:bg-slate-600">BASSE</Badge>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "OPEN": return <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50">OUVERT</Badge>;
            case "IN_PROGRESS": return <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50">EN COURS</Badge>;
            case "RESOLVED": return <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">RÉSOLU</Badge>;
            default: return <Badge variant="outline" className="text-slate-600 border-slate-600 bg-slate-50">CLOS</Badge>;
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedTicket) return;
        const res = await updateTicketStatus(selectedTicket.id, newStatus as any, selectedTicket.adminComment);
        if (res.success) {
            toast.success(`Le ticket est passé en ${newStatus}`);
            setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t));
            setSelectedTicket({ ...selectedTicket, status: newStatus });
        } else {
            toast.error(res.error);
        }
    };

    const handleCommentSave = async (comment: string) => {
        if (!selectedTicket) return;
        const res = await updateTicketStatus(selectedTicket.id, selectedTicket.status, comment);
        if (res.success) {
            toast.success(`Note interne sauvegardée`);
            setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, adminComment: comment } : t));
            setSelectedTicket({ ...selectedTicket, adminComment: comment });
        } else {
            toast.error(res.error);
        }
    };

    // VUE KANBAN
    const KanbanColumn = ({ title, statusId, icon: Icon, tickets: colTickets }: any) => (
        <div className="flex-1 min-w-[300px] bg-slate-100/50 rounded-xl border border-slate-200 p-4 flex flex-col h-[70vh]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                <h3 className="font-bold flex items-center gap-2 text-slate-700">
                    <Icon className="h-5 w-5" />
                    {title}
                </h3>
                <span className="bg-white text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    {colTickets.length}
                </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                {colTickets.map((t: any) => (
                    <div 
                        key={t.id} 
                        onClick={() => setSelectedTicket(t)}
                        className="bg-white border hover:border-blue-400 border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-2 gap-2">
                            {getUrgencyBadge(t.urgency)}
                            <span className="text-[10px] text-slate-400 font-medium">#{t.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 line-clamp-2 leading-tight mb-2 group-hover:text-blue-700">
                            {t.subject}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                            {t.description}
                        </p>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 uppercase rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                    {t.user.firstName[0]}{t.user.lastName[0]}
                                </div>
                                <span className="text-[11px] font-medium text-slate-500">{t.user.firstName}</span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                                {format(new Date(t.createdAt), "dd MMM HH:mm", { locale: fr })}
                            </span>
                        </div>
                    </div>
                ))}
                {colTickets.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                        Aucun ticket
                    </div>
                )}
            </div>
        </div>
    );

    // VUE TABLE
    const TableView = () => (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Urgence</th>
                        <th className="px-6 py-4">Sujet</th>
                        <th className="px-6 py-4">Déclaré par</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Statut</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {tickets.map(t => (
                        <tr key={t.id} onClick={() => setSelectedTicket(t)} className="hover:bg-slate-50 cursor-pointer group">
                            <td className="px-6 py-4 font-mono text-xs text-slate-400">#{t.id.slice(-6).toUpperCase()}</td>
                            <td className="px-6 py-4">{getUrgencyBadge(t.urgency)}</td>
                            <td className="px-6 py-4 font-medium text-slate-800 group-hover:text-blue-600">{t.subject}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{t.user.firstName} {t.user.lastName}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-slate-500">{format(new Date(t.createdAt), "dd/MM/yy HH:mm", { locale: fr })}</td>
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
                    <TabsList className="bg-slate-100 p-1">
                        <TabsTrigger value="kanban" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <LayoutGrid className="h-4 w-4 mr-2" /> Vue Kanban
                        </TabsTrigger>
                        <TabsTrigger value="table" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <ListFilter className="h-4 w-4 mr-2" /> Vue Liste
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="kanban" className="mt-0">
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        <KanbanColumn title="Nouveaux & Ouverts" statusId="OPEN" icon={AlertTriangle} tickets={tickets.filter(t => t.status === "OPEN")} />
                        <KanbanColumn title="En Cours d'analyse" statusId="IN_PROGRESS" icon={HardDrive} tickets={tickets.filter(t => t.status === "IN_PROGRESS")} />
                        <KanbanColumn title="Résolus" statusId="RESOLVED" icon={ShieldCheck} tickets={tickets.filter(t => t.status === "RESOLVED")} />
                    </div>
                </TabsContent>

                <TabsContent value="table" className="mt-0">
                    <TableView />
                </TabsContent>
            </Tabs>

            {/* TICKET DETAILS MODAL */}
            {selectedTicket && (
                <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                    <DialogContent className="sm:max-w-[700px] bg-slate-50 p-0 overflow-hidden border-2 border-slate-200">
                        <div className="bg-white px-6 py-4 border-b flex justify-between items-start">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <DialogTitle className="text-xl font-bold text-slate-800">{selectedTicket.subject}</DialogTitle>
                                    {getUrgencyBadge(selectedTicket.urgency)}
                                </div>
                                <DialogDescription>
                                    Ticket #{selectedTicket.id.slice(-6).toUpperCase()} • Signalé le {format(new Date(selectedTicket.createdAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="px-6 py-5 grid grid-cols-3 gap-6 h-[50vh] overflow-y-auto">
                            <div className="col-span-2 space-y-6">
                                <section>
                                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Description du problème</h4>
                                    <div className="bg-white p-4 rounded-xl border shadow-sm text-sm text-slate-700 whitespace-pre-wrap">
                                        {selectedTicket.description}
                                    </div>
                                    {selectedTicket.pageUrl && (
                                        <a href={selectedTicket.pageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                                            <LinkIcon className="h-4 w-4" />
                                            Ouvrir la page concernée
                                        </a>
                                    )}
                                </section>

                                {selectedTicket.imageUrl && (
                                    <section>
                                        <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4" /> Capture d'écran
                                        </h4>
                                        <div className="bg-white p-2 rounded-xl border shadow-sm">
                                            <a href={selectedTicket.imageUrl} target="_blank" rel="noreferrer">
                                                <img src={selectedTicket.imageUrl} className="w-full h-auto rounded-lg hover:opacity-90 transition-opacity" alt="Piece jointe" />
                                            </a>
                                        </div>
                                    </section>
                                )}
                            </div>

                            <div className="space-y-6">
                                <section className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
                                    <div>
                                        <Label className="text-xs text-slate-400 font-bold uppercase">Statut</Label>
                                        <Select value={selectedTicket.status} onValueChange={handleStatusChange}>
                                            <SelectTrigger className="mt-1 border-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="OPEN">Ouvert</SelectItem>
                                                <SelectItem value="IN_PROGRESS">En Cours</SelectItem>
                                                <SelectItem value="RESOLVED">Résolu</SelectItem>
                                                <SelectItem value="CLOSED">Fermé (Archivé)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <Label className="text-xs text-slate-400 font-bold uppercase">Déclaré par</Label>
                                        <div className="mt-2 flex items-center gap-3">
                                            <div className="h-8 w-8 uppercase rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
                                                {selectedTicket.user.firstName[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-800">{selectedTicket.user.firstName} {selectedTicket.user.lastName}</div>
                                                <div className="text-[10px] uppercase font-bold text-blue-600">
                                                    {(selectedTicket.user.roles || []).join(', ')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <Label className="text-xs text-slate-400 font-bold uppercase">Catégorie</Label>
                                        <div className="mt-1 text-sm font-medium text-slate-700">{selectedTicket.category.replace('_', ' ')}</div>
                                    </div>
                                </section>

                                <section>
                                    <Label className="text-xs text-slate-400 font-bold uppercase block mb-2">Note de Résolution (Interne)</Label>
                                    <Textarea 
                                        className="bg-white resize-none text-sm h-32" 
                                        placeholder="Notez ici la solution apportée..."
                                        defaultValue={selectedTicket.adminComment || ""}
                                        onBlur={(e) => handleCommentSave(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-2 italic">Sauvegardé automatiquement</p>
                                </section>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
