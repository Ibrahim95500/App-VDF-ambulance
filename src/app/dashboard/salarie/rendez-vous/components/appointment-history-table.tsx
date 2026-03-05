"use client"

import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MessageSquare, Eye, MessageSquareQuote, MapPin, Phone, Loader2, ArrowRightLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { submitRescheduleRequest } from "@/actions/appointment-request.actions"
import { TablePagination } from "@/components/common/table-pagination"
import { TableActions } from "@/components/common/table-actions"
import { isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { DateRange } from "react-day-picker"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { AppointmentRequest } from "@prisma/client"

export function AppointmentHistoryTable({ initialData }: { initialData: AppointmentRequest[] }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedReq, setSelectedReq] = useState<AppointmentRequest | any>(null)
    const [isNegotiating, setIsNegotiating] = useState(false)
    const [newProposedDate, setNewProposedDate] = useState("")
    const [negotiationMessage, setNegotiationMessage] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const PAGE_SIZE = 10

    useEffect(() => { setCurrentPage(1) }, [searchTerm, statusFilter, dateRange])

    const filteredData = useMemo(() => {
        return initialData.filter(req => {
            const searchStr = `${req.reason}`.toLowerCase()
            if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) return false
            if (statusFilter !== "ALL" && req.status !== statusFilter) return false
            if (dateRange?.from) {
                const reqDate = new Date(req.createdAt)
                const start = startOfDay(dateRange.from)
                const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)
                if (!isWithinInterval(reqDate, { start, end })) return false
            }
            return true
        })
    }, [initialData, searchTerm, statusFilter, dateRange])

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return filteredData.slice(start, start + PAGE_SIZE)
    }, [filteredData, currentPage])

    const getStatusBadge = (status: string) => {
        if (status === 'APPROVED') return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Approuvée</Badge>
        if (status === 'REJECTED') return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Refusée</Badge>
        return <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">En attente</Badge>
    }

    const handleRescheduleSubmit = async () => {
        if (!selectedReq) return;
        if (!newProposedDate) {
            toast.error("Veuillez sélectionner une date et une heure.");
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await submitRescheduleRequest(selectedReq.id, new Date(newProposedDate), negotiationMessage);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Demande de report envoyée avec succès.");
                // Update local state optimistic
                setSelectedReq({ ...selectedReq, rescheduleStatus: 'PENDING' });
                setIsNegotiating(false);
                setNewProposedDate("");
                setNegotiationMessage("");
            }
        } catch (error: any) {
            toast.error("Une erreur est survenue.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (initialData.length === 0) {
        return (
            <div className="flex flex-col rounded-xl border border-secondary/50 border-t-4 border-t-secondary items-center justify-center p-12 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mb-4 opacity-20" />
                <p>Vous n'avez pas encore de demandes de rendez-vous.</p>
            </div>
        )
    }

    const exportData = useMemo(() => {
        return filteredData.map(req => ({
            "Date de demande": format(new Date(req.createdAt), 'dd/MM/yyyy'),
            "Motif": req.reason || "-",
            "RDV Prévu": req.appointmentDate ? format(new Date(req.appointmentDate), "dd/MM/yyyy HH:mm") : "-",
            "Statut": req.status === 'PENDING' ? 'En Attente' : req.status === 'APPROVED' ? 'Approuvée' : 'Refusée'
        }))
    }, [filteredData])

    const statusOptions = [
        { label: "En Attente", value: "PENDING" },
        { label: "Approuvé", value: "APPROVED" },
        { label: "Refusé", value: "REJECTED" }
    ]

    return (
        <div className="flex flex-col">
            <TableActions
                data={exportData}
                onSearch={setSearchTerm}
                onStatusChange={setStatusFilter}
                onDateRangeChange={setDateRange}
                statusOptions={statusOptions}
                filename="mes_rendez_vous"
                pdfTitle="Historique de mes Demandes de Rendez-vous"
            />

            {/* Mobile card view */}
            <div className="md:hidden border border-border rounded-xl overflow-hidden divide-y divide-border mt-4">
                {paginatedData.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center bg-background">
                        <MessageSquareQuote className="h-8 w-8 mb-3 opacity-20" />
                        <p>Aucune demande trouvée</p>
                    </div>
                ) : (
                    paginatedData.map((req) => (
                        <div key={req.id} className="p-4 bg-background">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex flex-col gap-1 min-w-0">
                                    <p className="font-bold text-foreground text-sm truncate">{req.reason}</p>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                        <Calendar className="size-3" /> Demandé le {format(new Date(req.createdAt), 'dd/MM/yyyy')}
                                    </div>
                                </div>
                                {getStatusBadge(req.status)}
                            </div>

                            {req.status === 'APPROVED' && req.appointmentDate && (
                                <div className="space-y-2 mb-4 bg-green-50 p-3 rounded-lg border border-green-100">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-700 font-semibold">RDV Prévu:</span>
                                        <span className="font-bold text-green-700">
                                            {format(new Date(req.appointmentDate), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 bg-white"
                                    onClick={() => setSelectedReq(req)}
                                >
                                    <Eye className="w-4 h-4 mr-2" /> Détails
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block rounded-xl border border-border bg-background overflow-hidden mt-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left align-middle text-muted-foreground min-w-[600px]">
                        <thead className="text-xs uppercase bg-muted/20 text-muted-foreground border-b border-border">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Date Demande</th>
                                <th className="px-5 py-3 font-semibold">Motif</th>
                                <th className="px-5 py-3 font-semibold text-center">RDV Prévu</th>
                                <th className="px-5 py-3 font-semibold text-right">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground italic">
                                        Aucune demande de rendez-vous trouvée.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((req) => (
                                    <tr key={req.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-5 py-4 font-medium text-foreground whitespace-nowrap">
                                            {format(new Date(req.createdAt), 'dd/MM/yyyy')}
                                        </td>
                                        <td className="px-5 py-4 font-bold text-foreground">
                                            <span className="max-w-[200px] block truncate" title={req.reason || ""}>
                                                {req.reason}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {req.status === 'APPROVED' && req.appointmentDate ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-green-600 font-semibold text-xs bg-green-50 px-2 py-0.5 rounded border border-green-200 block whitespace-nowrap">
                                                        {format(new Date(req.appointmentDate), "dd MMM yyyy", { locale: fr })}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-muted-foreground mt-0.5">
                                                        {format(new Date(req.appointmentDate), "HH:mm")}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground/50 italic">-</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {req.adminComment && (
                                                    <span title="Un commentaire a été laissé">
                                                        <MessageSquareQuote className="size-4 text-muted-foreground opacity-70" />
                                                    </span>
                                                )}
                                                {getStatusBadge(req.status)}
                                                <Button variant="ghost" size="icon" className="size-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 ml-2" onClick={() => setSelectedReq(req)}>
                                                    <Eye className="size-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredData.length > 0 && (
                    <div className="border-t border-border bg-muted/20">
                        <TablePagination
                            currentPage={currentPage}
                            totalItems={filteredData.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Detail dialog */}
            <Dialog open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
                <DialogContent className="max-w-[92vw] sm:max-w-md border-border bg-background p-0 overflow-hidden flex flex-col max-h-[92dvh]">
                    <DialogHeader className="p-5 bg-slate-900 text-white shrink-0">
                        <div className="text-slate-400 text-[10px] mb-1 uppercase tracking-widest font-bold">
                            Demande de Rendez-vous
                        </div>
                        <DialogTitle className="text-lg font-black text-white">{selectedReq?.reason}</DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" /> Demandé le {selectedReq ? format(new Date(selectedReq.createdAt), 'dd MMMM yyyy', { locale: fr }) : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-5 space-y-4 overflow-y-auto flex-1">
                        <div className="flex items-center justify-between pb-3 border-b border-border">
                            <span className="text-sm font-semibold text-muted-foreground">Statut</span>
                            {selectedReq && getStatusBadge(selectedReq.status)}
                        </div>

                        {selectedReq?.status === 'APPROVED' && selectedReq.appointmentDate && (
                            <div className="bg-green-50/50 rounded-xl p-4 border border-green-200">
                                <h4 className="text-xs uppercase text-green-700 font-bold tracking-wider mb-3">Détails du Rendez-vous</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center size-8 rounded-full bg-green-100 text-green-600">
                                            <Calendar className="size-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground">Date et Heure</span>
                                            <span className="text-sm font-bold text-green-800">
                                                {format(new Date(selectedReq.appointmentDate), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedReq.appointmentMode && (
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center size-8 rounded-full bg-blue-100 text-blue-600">
                                                {selectedReq.appointmentMode === 'TELEPHONE' ? <Phone className="size-4" /> : <MapPin className="size-4" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted-foreground">Modalité</span>
                                                <span className="text-sm font-bold text-blue-800">
                                                    {selectedReq.appointmentMode === 'TELEPHONE' ? 'Par Téléphone' : 'Au Bureau'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedReq?.description && (
                            <div className="space-y-1">
                                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Description de la demande</span>
                                <p className="text-sm text-foreground p-3 bg-muted/30 rounded-lg border border-border">
                                    {selectedReq.description}
                                </p>
                            </div>
                        )}

                        {selectedReq?.adminComment && (
                            <div className="space-y-1">
                                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Message de la RH</span>
                                <p className={`text-sm p-3 rounded-lg border italic ${selectedReq.status === 'APPROVED' ? 'bg-green-50 text-green-900 border-green-200' :
                                    selectedReq.status === 'REJECTED' ? 'bg-red-50 text-red-900 border-red-200' :
                                        'bg-muted text-foreground border-border'
                                    }`}>
                                    "{selectedReq.adminComment}"
                                </p>
                            </div>
                        )}

                        {/* Historique des reports */}
                        {selectedReq && selectedReq.rescheduleHistory && Array.isArray(selectedReq.rescheduleHistory) && selectedReq.rescheduleHistory.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-border">
                                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Historique des échanges</span>
                                <div className="space-y-3 pl-2 border-l-2 border-slate-200">
                                    {(selectedReq.rescheduleHistory as any[]).map((event: any, idx: number) => (
                                        <div key={idx} className="relative pl-4">
                                            <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-slate-300 border-2 border-white" />
                                            <p className="text-xs font-semibold text-slate-700">
                                                {event.actor === 'SALARIE' ? 'Vous' : 'La Direction RH'} {' a '}
                                                {event.action === 'PROPOSE' ? 'proposé une nouvelle date' :
                                                    event.action === 'ACCEPT' ? 'accepté le report' : 'refusé le report'}
                                            </p>
                                            <span className="text-[10px] text-slate-500">
                                                {format(new Date(event.date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                            </span>
                                            {event.proposedDate && (
                                                <p className="text-sm text-slate-900 font-bold mt-1">
                                                    Nouvelle date : <span className="text-blue-600">{format(new Date(event.proposedDate), "dd/MM/yyyy HH:mm", { locale: fr })}</span>
                                                </p>
                                            )}
                                            {event.message && (
                                                <p className="text-xs italic text-slate-600 bg-slate-50 p-2 rounded mt-1 border border-slate-100">
                                                    "{event.message}"
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Formulaire de report ou Status en attente ou Bloqué */}
                        {selectedReq?.status === 'APPROVED' && (
                            <div className="pt-2">
                                {(() => {
                                    // Check if the last action in history is a rejection by HR
                                    const history = selectedReq.rescheduleHistory as any[] || [];
                                    const lastAction = history.length > 0 ? history[history.length - 1] : null;
                                    const isBlocked = lastAction && lastAction.actor === 'RH' && lastAction.action === 'REJECT';

                                    if (isBlocked) {
                                        return (
                                            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm flex flex-col items-center justify-center gap-2 text-center">
                                                <div className="flex items-center gap-2 font-bold mb-1">
                                                    <span className="text-xl">🛑</span>
                                                    <span>Action Impossible</span>
                                                </div>
                                                <p>La Direction a refusé votre contre-proposition.</p>
                                                <p className="font-semibold mt-1">La date du rendez-vous est maintenue au {format(new Date(selectedReq.appointmentDate!), "dd/MM/yyyy 'à' HH:mm", { locale: fr })} et ne peut plus être modifiée.</p>
                                            </div>
                                        );
                                    }

                                    if (selectedReq.rescheduleStatus === 'PENDING') {
                                        return (
                                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-xl text-sm flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                                                <span>Demande de report en attente de validation RH</span>
                                            </div>
                                        );
                                    }

                                    if (isNegotiating) {
                                        return (
                                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                                                <h5 className="text-sm font-bold flex items-center gap-2 text-slate-800">
                                                    <ArrowRightLeft className="w-4 h-4" /> Proposer un report
                                                </h5>
                                                <div>
                                                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Nouvelle Date et Heure souhaitée</label>
                                                    <Input
                                                        type="datetime-local"
                                                        value={newProposedDate}
                                                        onChange={(e) => setNewProposedDate(e.target.value)}
                                                        className="bg-white text-slate-900 border-slate-300 focus-visible:ring-blue-500 [&::-webkit-calendar-picker-indicator]:opacity-100"
                                                        style={{ colorScheme: 'light', color: '#111827', backgroundColor: '#ffffff' }}
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Motif du report (Optionnel)</label>
                                                    <Textarea
                                                        placeholder="Pourquoi demandez-vous à décaler ?"
                                                        value={negotiationMessage}
                                                        onChange={(e) => setNegotiationMessage(e.target.value)}
                                                        className="bg-white resize-none h-20"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2 pt-2">
                                                    <Button variant="outline" size="sm" onClick={() => setIsNegotiating(false)} disabled={isSubmitting} className="bg-white text-slate-800 hover:bg-slate-100 border-slate-300 font-medium">
                                                        Annuler
                                                    </Button>
                                                    <Button size="sm" onClick={handleRescheduleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                                        {isSubmitting && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                                                        Envoyer
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <Button
                                            variant="outline"
                                            className="w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 mt-2"
                                            onClick={() => setIsNegotiating(true)}
                                        >
                                            <ArrowRightLeft className="w-4 h-4 mr-2" /> Demander un report
                                        </Button>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
