"use client"

import { useState, useMemo, useEffect } from "react"
import { AdvanceRequestWithUser } from "@/services/advance-request"
import { updateRequestStatus } from "@/actions/advance-request.actions"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { TableActions } from "@/components/common/table-actions"
import { TablePagination } from "@/components/common/table-pagination"
import { isWithinInterval, startOfDay, endOfDay, format } from "date-fns"
import { fr } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { Loader2, CheckCircle2, XCircle, Eye, MessageSquareQuote } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { HRStatsCharts } from "../components/hr-stats-charts"

export function AcomptesTable({ initialData }: { initialData: AdvanceRequestWithUser[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedRequest, setSelectedRequest] = useState<AdvanceRequestWithUser | null>(null)
    const [processingAction, setProcessingAction] = useState<{ id: string, status: "APPROVED" | "REJECTED", request: AdvanceRequestWithUser } | null>(null)
    const [adminComment, setAdminComment] = useState("")

    const PAGE_SIZE = 10

    useEffect(() => { setCurrentPage(1) }, [searchTerm, statusFilter, dateRange])

    const initiateAction = (req: AdvanceRequestWithUser, status: "APPROVED" | "REJECTED") => {
        setProcessingAction({ id: req.id, status, request: req })
        setAdminComment("")
        setSelectedRequest(null) // Close details dialog if open
    }

    const confirmAction = async () => {
        if (!processingAction) return;
        try {
            setLoadingId(processingAction.id)
            await updateRequestStatus(processingAction.id, processingAction.status, adminComment.trim() || undefined)
            toast.success(`Demande ${processingAction.status === 'APPROVED' ? 'Approuvée' : 'Refusée'}`)
            setProcessingAction(null)
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue")
        } finally {
            setLoadingId(null)
        }
    }

    const userStats = useMemo(() => {
        if (!selectedRequest) return null;
        const userRequests = initialData.filter(req => req.userId === selectedRequest.userId);

        const statusCounts: Record<string, number> = {}
        const monthCounts: Record<string, number> = {}

        const sortedRequests = [...userRequests].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

        sortedRequests.forEach(req => {
            const statusMap: Record<string, string> = {
                'PENDING': 'En attente',
                'APPROVED': 'Approuvé',
                'REJECTED': 'Refusé'
            };
            const status = statusMap[req.status] || req.status;
            statusCounts[status] = (statusCounts[status] || 0) + 1

            const date = new Date(req.createdAt)
            const monthYearStr = format(date, 'MMM yyyy', { locale: fr })
            const monthYear = monthYearStr.charAt(0).toUpperCase() + monthYearStr.slice(1)
            monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1
        })

        return {
            requestsByCategory: Object.entries(statusCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
            requestsByMonth: Object.keys(monthCounts).map(name => ({ name, value: monthCounts[name] }))
        }
    }, [selectedRequest, initialData]);

    const filteredData = useMemo(() => {
        return initialData.filter(req => {
            // Search filter
            const searchStr = `${req.user.name} ${req.user.email} ${req.amount} ${req.reason}`.toLowerCase()
            if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) return false

            // Status filter
            if (statusFilter !== "ALL" && req.status !== statusFilter) return false

            // Date filter
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

    const exportData = useMemo(() => {
        return filteredData.map(req => ({
            "Collaborateur": req.user.name || req.user.email,
            "Email": req.user.email,
            "Montant (€)": req.amount,
            "Motif": req.reason || "-",
            "Date": new Date(req.createdAt).toLocaleDateString('fr-FR'),
            "Statut": req.status === 'PENDING' ? 'En Attente' : req.status === 'APPROVED' ? 'Approuvé' : 'Refusé'
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
                filename="acomptes_global"
                pdfTitle="Liste des Demandes d'Acomptes"
            />

            {/* Mobile card view */}
            <div className="md:hidden border border-border rounded-xl overflow-hidden divide-y divide-border">
                {filteredData.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground italic">
                        {initialData.length === 0 ? "Aucune demande." : "Aucun résultat pour ces filtres."}
                    </div>
                ) : paginatedData.map((req) => (
                    <div key={req.id} className="p-4 flex gap-3 items-start hover:bg-muted/5 transition-colors">
                        {req.user.image ? (
                            <img src={req.user.image} className="w-9 h-9 rounded-full object-cover shrink-0 border border-border" alt="" />
                        ) : (
                            <div className="size-9 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0 border border-primary/20 text-sm">
                                {req.user.name?.charAt(0) || req.user.email?.charAt(0) || '?'}
                            </div>
                        )}
                        <div className="flex flex-col grow gap-1.5 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-semibold text-foreground text-sm truncate">{req.user.name || req.user.email}</p>
                                    <p className="text-xs text-muted-foreground truncate">{req.user.email}</p>
                                </div>
                                <span className="text-base font-bold text-foreground shrink-0">{req.amount} €</span>
                            </div>
                            {req.reason && <p className="text-xs text-muted-foreground italic truncate">{req.reason}</p>}
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    {req.status === 'PENDING' && <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200 text-[10px]">En Attente</Badge>}
                                    {req.status === 'APPROVED' && <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 text-[10px]">Approuvé</Badge>}
                                    {req.status === 'REJECTED' && <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200 text-[10px]">Refusé</Badge>}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Button variant="ghost" size="icon" className="size-7 text-blue-500 hover:bg-blue-50" onClick={() => setSelectedRequest(req)}>
                                        <Eye className="size-3.5" />
                                    </Button>
                                    {req.status === 'PENDING' && (
                                        <>
                                            <Button size="sm" variant="secondary" className="h-7 text-[11px] px-2.5" disabled={loadingId === req.id} onClick={() => initiateAction(req, "APPROVED")}>Accepter</Button>
                                            <Button size="sm" variant="destructive" className="h-7 text-[11px] px-2.5" disabled={loadingId === req.id} onClick={() => initiateAction(req, "REJECTED")}>Refuser</Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto border border-border rounded-xl w-full">
                <table className="w-full text-sm text-left align-middle text-muted-foreground border-collapse min-w-[800px]">
                    <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                        <tr>
                            <th scope="col" className="px-4 py-3 font-semibold">Salarié</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Montant</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Motif</th>
                            <th scope="col" className="px-4 py-3 font-semibold text-center">Date</th>
                            <th scope="col" className="px-4 py-3 font-semibold text-center">Statut</th>
                            <th scope="col" className="px-4 py-3 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">
                                    {initialData.length === 0 ? "Aucune demande." : "Aucun résultat pour ces filtres."}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((req) => (
                                <tr key={req.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {req.user.image ? (
                                                <img src={req.user.image} className="w-8 h-8 rounded-full bg-border object-cover" alt="" />
                                            ) : (
                                                <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary font-semibold rounded-full border border-primary/20">
                                                    {req.user.name?.charAt(0) || req.user.email?.charAt(0) || '?'}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground leading-none">{req.user.name || "-"}</span>
                                                <span className="text-[10px] text-muted-foreground mt-1">{req.user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-foreground">
                                        {req.amount} €
                                    </td>
                                    <td className="px-4 py-3 max-w-[150px] truncate" title={req.reason || ""}>
                                        {req.reason || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-4 py-3 text-center text-[11px]">
                                        {req.status === 'PENDING' && <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">En Attente</Badge>}
                                        {req.status === 'APPROVED' && <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Approuvé</Badge>}
                                        {req.status === 'REJECTED' && <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Refusé</Badge>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setSelectedRequest(req)}
                                                className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                                title="Détails"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {req.status === 'PENDING' ? (
                                                <>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50"
                                                        disabled={loadingId === req.id}
                                                        onClick={() => initiateAction(req, "APPROVED")}
                                                    >
                                                        {loadingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50"
                                                        disabled={loadingId === req.id}
                                                        onClick={() => initiateAction(req, "REJECTED")}
                                                    >
                                                        {loadingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                    </Button>
                                                </>
                                            ) : (
                                                <span className="text-[10px] italic text-muted-foreground ml-2">Traité</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <TablePagination
                currentPage={currentPage}
                totalItems={filteredData.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
            />

            {/* Advance Request Detail Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent className="max-w-[90vw] sm:max-w-xl border-border bg-background p-0 gap-0 overflow-y-auto max-h-[90vh] pb-8">
                    <DialogHeader className="p-5 bg-slate-900 text-white">
                        <div className="text-slate-400 text-[10px] mb-1 uppercase tracking-widest font-bold">
                            Acompte
                        </div>
                        <DialogTitle className="text-lg font-black italic text-white">
                            {selectedRequest?.user.name || selectedRequest?.user.email}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs">
                            Date: {selectedRequest ? new Date(selectedRequest.createdAt).toLocaleDateString('fr-FR') : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Montant</span>
                            <span className="font-bold text-foreground">{selectedRequest?.amount} €</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Statut</span>
                            {selectedRequest?.status === 'APPROVED' && <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Approuvé</Badge>}
                            {selectedRequest?.status === 'REJECTED' && <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Refusé</Badge>}
                            {selectedRequest?.status === 'PENDING' && <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">En attente</Badge>}
                        </div>
                        {selectedRequest?.reason && (
                            <div className="space-y-1">
                                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Motif</span>
                                <p className="text-sm text-foreground p-3 bg-muted/30 rounded-lg border border-border italic">
                                    {selectedRequest.reason}
                                </p>
                            </div>
                        )}
                        {selectedRequest?.status === 'PENDING' && (
                            <div className="flex gap-2 pt-2">
                                <Button size="sm" variant="outline" className="flex-1 text-green-600 border-green-200 hover:bg-green-50" onClick={() => initiateAction(selectedRequest, 'APPROVED')} disabled={loadingId === selectedRequest.id}>
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Accepter
                                </Button>
                                <Button size="sm" variant="destructive" className="flex-1" onClick={() => initiateAction(selectedRequest, 'REJECTED')} disabled={loadingId === selectedRequest.id}>
                                    <XCircle className="w-4 h-4 mr-1.5" /> Refuser
                                </Button>
                            </div>
                        )}

                        {userStats && (userStats.requestsByCategory.length > 0 || userStats.requestsByMonth.length > 0) && (
                            <div className="pt-4 mt-4 border-t border-border">
                                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-2 block">Statistiques Personnelles d'Acomptes</span>
                                <HRStatsCharts
                                    requestsByCategory={userStats.requestsByCategory}
                                    requestsByUser={[]}
                                    requestsByMonth={userStats.requestsByMonth}
                                    hideUserTab
                                    categoryLabel="Par Statut"
                                    title="Historique des Acomptes"
                                    description="Analyse des demandes d'acomptes précédentes de ce salarié."
                                />
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Validation/Rejection Comment Dialog */}
            <Dialog open={!!processingAction} onOpenChange={(open) => !open && setProcessingAction(null)}>
                <DialogContent className="max-w-[90vw] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {processingAction?.status === 'APPROVED' ? (
                                <><CheckCircle2 className="w-5 h-5 text-green-600" /> Confirmer l'approbation</>
                            ) : (
                                <><XCircle className="w-5 h-5 text-red-600" /> Confirmer le refus</>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            Demande de {processingAction?.request.amount}€ par {processingAction?.request.user.name || processingAction?.request.user.email}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="adminComment" className="text-sm font-medium flex items-center gap-2">
                                <MessageSquareQuote className="w-4 h-4 text-muted-foreground" />
                                Commentaire pour le collaborateur (optionnel)
                            </label>
                            <Textarea
                                id="adminComment"
                                placeholder={`Ex: ${processingAction?.status === 'APPROVED' ? 'Validé exceptionnellement ce mois-ci.' : 'Plafond mensuel atteint ou période incorrecte.'}`}
                                value={adminComment}
                                onChange={(e) => setAdminComment(e.target.value)}
                                className="resize-none"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setProcessingAction(null)}>
                            Annuler
                        </Button>
                        <Button
                            variant={processingAction?.status === 'APPROVED' ? "primary" : "destructive"}
                            className={processingAction?.status === 'APPROVED' ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                            disabled={loadingId === processingAction?.id}
                            onClick={confirmAction}
                        >
                            {loadingId === processingAction?.id && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {processingAction?.status === 'APPROVED' ? "Confirmer l'approbation" : "Confirmer le refus"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
