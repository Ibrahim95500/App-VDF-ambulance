'use client'

import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableActions } from "@/components/common/table-actions"
import { TablePagination } from "@/components/common/table-pagination"
import { isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { DateRange } from "react-day-picker"
import { Eye } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

interface AdvanceRequest {
    id: string
    amount: number
    reason: string | null
    status: string
    createdAt: Date
}

export function AdvanceHistoryTable({ initialData }: { initialData: AdvanceRequest[] }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedReq, setSelectedReq] = useState<AdvanceRequest | null>(null)
    const PAGE_SIZE = 10

    useEffect(() => { setCurrentPage(1) }, [searchTerm, statusFilter, dateRange])

    const filteredData = useMemo(() => {
        return initialData.filter(req => {
            const searchStr = `${req.amount} ${req.reason}`.toLowerCase()
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

    const exportData = useMemo(() => {
        return filteredData.map(req => ({
            "Date": new Date(req.createdAt).toLocaleDateString('fr-FR'),
            "Montant": `${req.amount} €`,
            "Motif": req.reason || "-",
            "Statut": req.status === 'PENDING' ? 'En Attente' : req.status === 'APPROVED' ? 'Approuvé' : 'Refusé'
        }))
    }, [filteredData])

    const statusOptions = [
        { label: "En Attente", value: "PENDING" },
        { label: "Approuvé", value: "APPROVED" },
        { label: "Refusé", value: "REJECTED" }
    ]

    const getStatusBadge = (status: string) => {
        if (status === 'APPROVED') return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Approuvé</Badge>
        if (status === 'REJECTED') return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Refusé</Badge>
        return <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">En Attente</Badge>
    }

    return (
        <div className="flex flex-col">
            <TableActions
                data={exportData}
                onSearch={setSearchTerm}
                onStatusChange={setStatusFilter}
                onDateRangeChange={setDateRange}
                statusOptions={statusOptions}
                filename="mes_acomptes"
                pdfTitle="Historique de mes Demandes d'Acompte"
            />

            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-border">
                {filteredData.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground italic">
                        {initialData.length === 0 ? "Aucune demande d'acompte." : "Aucun résultat pour ces filtres."}
                    </div>
                ) : paginatedData.map((req) => (
                    <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-1 min-w-0">
                            <p className="font-bold text-foreground text-base">{req.amount} €</p>
                            <p className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleDateString('fr-FR')}</p>
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
                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                        <tr>
                            <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                            <th scope="col" className="px-5 py-3 font-semibold">Montant</th>
                            <th scope="col" className="px-5 py-3 font-semibold">Motif</th>
                            <th scope="col" className="px-5 py-3 font-semibold text-right">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground italic">
                                    {initialData.length === 0 ? "Aucune demande d'acompte." : "Aucun résultat pour ces filtres."}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((req) => (
                                <tr key={req.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="px-5 py-4 font-medium text-foreground">
                                        {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-5 py-4 font-bold text-foreground">
                                        {req.amount} €
                                    </td>
                                    <td className="px-5 py-4 truncate max-w-[200px]" title={req.reason || ""}>
                                        {req.reason || "-"}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        {getStatusBadge(req.status)}
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

            {/* Detail dialog */}
            <Dialog open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
                <DialogContent className="max-w-[90vw] sm:max-w-sm border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-secondary text-lg font-bold">
                            {selectedReq?.amount} € — Acompte
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Soumis le {selectedReq ? new Date(selectedReq.createdAt).toLocaleDateString('fr-FR') : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Statut</span>
                            {selectedReq && getStatusBadge(selectedReq.status)}
                        </div>
                        {selectedReq?.reason && (
                            <div className="space-y-1">
                                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Motif</span>
                                <p className="text-sm text-foreground p-3 bg-muted/30 rounded-lg border border-border italic">
                                    {selectedReq.reason}
                                </p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
