"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { TableActions } from "@/components/common/table-actions"
import { isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { DateRange } from "react-day-picker"

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

    const filteredData = useMemo(() => {
        return initialData.filter(req => {
            // Search filter
            const searchStr = `${req.amount} ${req.reason}`.toLowerCase()
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

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left align-middle text-muted-foreground">
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
                            filteredData.map((req) => (
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
                                        {req.status === 'PENDING' && <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">En Attente</Badge>}
                                        {req.status === 'APPROVED' && <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Approuvé</Badge>}
                                        {req.status === 'REJECTED' && <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Refusé</Badge>}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
