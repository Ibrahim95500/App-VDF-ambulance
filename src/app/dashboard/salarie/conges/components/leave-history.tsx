'use client'

import { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeaveRequest, LeaveType } from '@prisma/client';
import { TableActions } from "@/components/common/table-actions";
import { TablePagination } from "@/components/common/table-pagination";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { Eye } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export function LeaveHistory({ requests }: { requests: LeaveRequest[] }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedItem, setSelectedItem] = useState<LeaveRequest | null>(null)
    const PAGE_SIZE = 10

    useEffect(() => { setCurrentPage(1) }, [searchTerm, statusFilter, dateRange])

    const formatType = (type: LeaveType) => {
        if (type === 'CP') return 'Congé payé (CP)';
        if (type === 'MA') return 'Maladie (MA)';
        return 'Congé sans solde (CSS)';
    }

    const filteredData = useMemo(() => {
        return requests.filter(req => {
            const searchStr = `${formatType(req.type)} ${req.reason}`.toLowerCase()
            if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) return false
            if (statusFilter !== "ALL" && req.status !== statusFilter) return false
            if (dateRange?.from) {
                const rangeStart = startOfDay(dateRange.from)
                const rangeEnd = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)
                const reqStart = new Date(req.startDate)
                const reqEnd = new Date(req.endDate)
                const overlaps = reqStart <= rangeEnd && reqEnd >= rangeStart
                if (!overlaps) return false
            }
            return true
        })
    }, [requests, searchTerm, statusFilter, dateRange])

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return filteredData.slice(start, start + PAGE_SIZE)
    }, [filteredData, currentPage])

    const exportData = useMemo(() => {
        return filteredData.map(req => ({
            "Type": formatType(req.type),
            "Début": new Date(req.startDate).toLocaleDateString('fr-FR'),
            "Période Début": req.startAmPm,
            "Fin": new Date(req.endDate).toLocaleDateString('fr-FR'),
            "Période Fin": req.endAmPm,
            "Motif": req.reason || "-",
            "Statut": req.status === 'PENDING' ? 'En Attente' : req.status === 'APPROVED' ? 'Approuvé' : 'Refusé',
            "Soumis le": new Date(req.createdAt).toLocaleDateString('fr-FR')
        }))
    }, [filteredData])

    const statusOptions = [
        { label: "En Attente", value: "PENDING" },
        { label: "Approuvé", value: "APPROVED" },
        { label: "Refusé", value: "REJECTED" }
    ]

    const getStatusBadge = (status: string) => {
        if (status === 'APPROVED') return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Approuvé</Badge>
        if (status === 'REJECTED') return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Refusé</Badge>
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">En Attente</Badge>
    }

    const formatDates = (req: LeaveRequest) => {
        const start = new Date(req.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const end = new Date(req.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        if (start === end) {
            return <span>{start} <span className="text-[10px] text-muted-foreground uppercase">{req.startAmPm}</span></span>
        }
        return (
            <div className="flex flex-col text-xs">
                <span><span className="text-muted-foreground">Du</span> {start} <span className="text-[10px] uppercase">{req.startAmPm}</span></span>
                <span><span className="text-muted-foreground">Au</span> {end} <span className="text-[10px] uppercase">{req.endAmPm}</span></span>
            </div>
        )
    }

    return (
        <div className="flex flex-col rounded-xl border border-secondary/50 border-t-4 border-t-secondary h-full">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-muted/5 rounded-t-xl">
                <h2 className="text-base font-semibold text-secondary tracking-wide">HISTORIQUE DE MES DEMANDES</h2>
            </div>

            <div className="p-5">
                <TableActions
                    data={exportData}
                    onSearch={setSearchTerm}
                    onStatusChange={setStatusFilter}
                    onDateRangeChange={setDateRange}
                    statusOptions={statusOptions}
                    filename="mes_conges"
                    pdfTitle="Mon Historique de Congés"
                />

                {/* Mobile card view */}
                <div className="md:hidden divide-y divide-border">
                    {filteredData.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground italic">
                            {requests.length === 0 ? "Aucune absence enregistrée." : "Aucun résultat trouvé."}
                        </div>
                    ) : paginatedData.map((item) => (
                        <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                            <div className="flex flex-col gap-1 min-w-0">
                                <p className="font-bold text-foreground text-sm">{formatType(item.type)}</p>
                                <div className="text-xs text-muted-foreground">{formatDates(item)}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {getStatusBadge(item.status)}
                                <Button variant="ghost" size="icon" className="size-7 text-blue-500 hover:bg-blue-50" onClick={() => setSelectedItem(item)}>
                                    <Eye className="size-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left align-middle text-muted-foreground">
                        <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                            <tr>
                                <th scope="col" className="px-4 py-3 font-semibold">Type</th>
                                <th scope="col" className="px-4 py-3 font-semibold">Période</th>
                                <th scope="col" className="px-4 py-3 font-semibold">Motif</th>
                                <th scope="col" className="px-4 py-3 font-semibold text-right">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground italic">
                                        {requests.length === 0 ? "Aucune absence enregistrée." : "Aucun résultat trouvé."}
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-4 py-4 font-bold text-foreground">{formatType(item.type)}</td>
                                        <td className="px-4 py-4">{formatDates(item)}</td>
                                        <td className="px-4 py-4 max-w-[150px] truncate" title={item.reason || ""}>{item.reason || "-"}</td>
                                        <td className="px-4 py-4 text-right">{getStatusBadge(item.status)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <TablePagination
                currentPage={currentPage}
                totalItems={filteredData.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
            />

            {/* Detail dialog */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="max-w-[90vw] sm:max-w-sm border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-secondary text-lg font-bold">
                            {selectedItem ? formatType(selectedItem.type) : ''}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            {selectedItem && <span>{formatDates(selectedItem)}</span>}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Statut</span>
                            {selectedItem && getStatusBadge(selectedItem.status)}
                        </div>
                        {selectedItem?.reason && (
                            <div className="space-y-1">
                                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Motif</span>
                                <p className="text-sm text-foreground p-3 bg-muted/30 rounded-lg border border-border italic">
                                    {selectedItem.reason}
                                </p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
