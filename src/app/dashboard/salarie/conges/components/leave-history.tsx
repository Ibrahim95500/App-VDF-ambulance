"use client"

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { LeaveRequest, LeaveType } from '@prisma/client';
import { TableActions } from "@/components/common/table-actions";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";

export function LeaveHistory({ requests }: { requests: LeaveRequest[] }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()

    const formatType = (type: LeaveType) => {
        if (type === 'CP') return 'Congé payé (CP)';
        if (type === 'MA') return 'Maladie (MA)';
        return 'Congé sans solde (CSS)';
    }

    const filteredData = useMemo(() => {
        return requests.filter(req => {
            // Search filter
            const searchStr = `${formatType(req.type)} ${req.reason}`.toLowerCase()
            if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) return false

            // Status filter
            if (statusFilter !== "ALL" && req.status !== statusFilter) return false

            // Date filter (overlaps)
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

    const getStatusText = (status: string) => {
        if (status === 'PENDING') return 'En Attente';
        if (status === 'APPROVED') return 'Approuvé';
        return 'Refusé';
    }

    const getStatusVariant = (status: string) => {
        if (status === 'APPROVED') return "bg-green-100 text-green-700 hover:bg-green-100 border-green-200";
        if (status === 'REJECTED') return "bg-red-100 text-red-700 hover:bg-red-100 border-red-200";
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200";
    }

    const formatDates = (req: LeaveRequest) => {
        const start = new Date(req.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const end = new Date(req.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        if (start === end) {
            return (
                <div className="flex flex-col">
                    <span>{start}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{req.startAmPm}</span>
                </div>
            )
        }
        return (
            <div className="flex flex-col text-xs">
                <span><span className="text-muted-foreground">Du</span> {start} <span className="text-[10px] uppercase">{req.startAmPm}</span></span>
                <span><span className="text-muted-foreground">Au</span> {end} <span className="text-[10px] uppercase">{req.endAmPm}</span></span>
            </div>
        )
    }

    return (
        <div className="bg-card text-card-foreground flex flex-col rounded-xl shadow-sm border border-border h-full">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-muted/5 rounded-t-xl">
                <h2 className="text-base font-semibold text-foreground tracking-wide">HISTORIQUE DE MES DEMANDES</h2>
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

                <div className="overflow-x-auto">
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
                                filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-4 py-4 font-bold text-foreground">
                                            {formatType(item.type)}
                                        </td>
                                        <td className="px-4 py-4 truncate">
                                            {formatDates(item)}
                                        </td>
                                        <td className="px-4 py-4 max-w-[150px] truncate" title={item.reason || ""}>
                                            {item.reason || "-"}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <Badge variant="outline" className={getStatusVariant(item.status)}>
                                                {getStatusText(item.status)}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
