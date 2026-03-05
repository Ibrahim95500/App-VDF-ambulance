"use client"

import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MessageSquare, Eye, MessageSquareQuote, MapPin, Phone } from "lucide-react"
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
    const [selectedReq, setSelectedReq] = useState<AppointmentRequest | null>(null)
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
            "Date de demande": new Date(req.createdAt).toLocaleDateString('fr-FR'),
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
                                        <Calendar className="size-3" /> Demandé le {new Date(req.createdAt).toLocaleDateString('fr-FR')}
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
                                            {new Date(req.createdAt).toLocaleDateString('fr-FR')}
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
