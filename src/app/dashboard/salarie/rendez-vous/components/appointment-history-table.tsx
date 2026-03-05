"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MessageSquare, Eye, MessageSquareQuote, MapPin, Phone } from "lucide-react"
import { TablePagination } from "@/components/common/table-pagination"
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
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedReq, setSelectedReq] = useState<AppointmentRequest | null>(null)
    const PAGE_SIZE = 10

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return initialData.slice(start, start + PAGE_SIZE)
    }, [initialData, currentPage])

    const getStatusBadge = (status: string) => {
        if (status === 'APPROVED') return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Approuvée</Badge>
        if (status === 'REJECTED') return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Refusée</Badge>
        return <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">En attente</Badge>
    }

    if (initialData.length === 0) {
        return (
            <div className="flex flex-col rounded-xl border border-secondary/50 border-t-4 border-t-secondary items-center justify-center p-12 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mb-4 opacity-20" />
                <p>Vous n'avez pas encore de demandes de rendez-vous.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col rounded-xl border border-secondary/50 border-t-4 border-t-secondary overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/5">
                <h2 className="text-base font-semibold text-secondary tracking-wide">HISTORIQUE DE MES DEMANDES</h2>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-border px-4">
                {paginatedData.map((req) => (
                    <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-1 min-w-0">
                            <p className="font-bold text-foreground text-sm truncate">{req.reason}</p>
                            <div className="flex flex-col gap-0.5 mt-1">
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Calendar className="size-3" />Demandé le {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                                {req.status === 'APPROVED' && req.appointmentDate && (
                                    <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium ml-4 mt-0.5">
                                        ↳ Prévu: {format(new Date(req.appointmentDate), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {getStatusBadge(req.status)}
                            <Button variant="ghost" size="icon" className="size-7 text-blue-500 hover:bg-blue-50" onClick={() => setSelectedReq(req)}>
                                <Eye className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left align-middle text-muted-foreground min-w-[600px]">
                    <thead className="text-xs uppercase bg-muted/20 text-muted-foreground border-b border-border">
                        <tr>
                            <th className="px-5 py-3 font-semibold">Motif</th>
                            <th className="px-5 py-3 font-semibold text-center">Date Demande</th>
                            <th className="px-5 py-3 font-semibold text-center">RDV Prévu</th>
                            <th className="px-5 py-3 font-semibold text-right">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {paginatedData.map((req) => (
                            <tr key={req.id} className="hover:bg-muted/10 transition-colors">
                                <td className="px-5 py-4 font-bold text-foreground whitespace-nowrap">
                                    {req.reason}
                                </td>
                                <td className="px-5 py-4 text-center text-muted-foreground text-sm">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <Calendar className="size-3" />
                                        {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                                    </div>
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
                                        <Button variant="ghost" size="icon" className="size-7 text-blue-500 hover:bg-blue-50 ml-2" onClick={() => setSelectedReq(req)}>
                                            <Eye className="size-3.5" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <TablePagination
                currentPage={currentPage}
                totalItems={initialData.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
            />

            {/* Detail dialog */}
            <Dialog open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
                <DialogContent className="max-w-[90vw] sm:max-w-md border-border bg-background p-0 overflow-hidden">
                    <DialogHeader className="p-5 bg-slate-900 text-white">
                        <div className="text-slate-400 text-[10px] mb-1 uppercase tracking-widest font-bold">
                            Demande de Rendez-vous
                        </div>
                        <DialogTitle className="text-lg font-black text-white">{selectedReq?.reason}</DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" /> Demandé le {selectedReq ? new Date(selectedReq.createdAt).toLocaleDateString('fr-FR') : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-5 space-y-4">
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
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
