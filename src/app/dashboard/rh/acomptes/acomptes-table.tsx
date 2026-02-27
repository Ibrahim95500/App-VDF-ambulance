"use client"

import { useState, useMemo } from "react"
import { AdvanceRequestWithUser } from "@/services/advance-request"
import { updateRequestStatus } from "@/actions/advance-request.actions"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { TableActions } from "@/components/common/table-actions"
import { isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { DateRange } from "react-day-picker"

export function AcomptesTable({ initialData }: { initialData: AdvanceRequestWithUser[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()

    const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
        try {
            setLoadingId(id)
            await updateRequestStatus(id, status)
            toast.success(`Demande ${status === 'APPROVED' ? 'Approuvée' : 'Refusée'}`)
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue")
        } finally {
            setLoadingId(null)
        }
    }

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

            <div className="overflow-x-auto bg-card rounded-xl border border-border shadow-sm">
                <table className="w-full text-sm text-left align-middle text-muted-foreground">
                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
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
                            filteredData.map((req) => (
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
                                        {req.status === 'PENDING' ? (
                                            <div className="flex gap-1.5 justify-end">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-7 text-[11px] px-2.5"
                                                    disabled={loadingId === req.id}
                                                    onClick={() => handleAction(req.id, "APPROVED")}
                                                >
                                                    Accepter
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-7 text-[11px] px-2.5"
                                                    disabled={loadingId === req.id}
                                                    onClick={() => handleAction(req.id, "REJECTED")}
                                                >
                                                    Refuser
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] italic text-muted-foreground">Traité</span>
                                        )}
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
