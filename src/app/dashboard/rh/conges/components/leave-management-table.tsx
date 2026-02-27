"use client"

import { useState, useMemo } from 'react';
import { updateLeaveRequestStatus } from '@/actions/leave-request.actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TableActions } from "@/components/common/table-actions";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";

type LeaveRequestFull = {
    id: string;
    type: string;
    startDate: Date;
    endDate: Date;
    startAmPm: string;
    endAmPm: string;
    reason: string | null;
    status: string;
    createdAt: Date;
    user: {
        name: string | null;
        email: string | null;
        image: string | null;
    }
};

export function LeaveManagementTable({ initialLeaves }: { initialLeaves: LeaveRequestFull[] }) {
    const router = useRouter();
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const handleAction = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
        setLoadingMap(prev => ({ ...prev, [id]: true }));
        try {
            await updateLeaveRequestStatus(id, newStatus);
            toast.success(newStatus === 'APPROVED' ? "Demande validée" : "Demande refusée");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue");
        } finally {
            setLoadingMap(prev => ({ ...prev, [id]: false }));
        }
    };

    const formatType = (type: string) => {
        if (type === 'CP') return 'Congé Payé (CP)';
        if (type === 'MA') return 'Maladie (MA)';
        return 'Sans Solde (CSS)';
    };

    const filteredData = useMemo(() => {
        return initialLeaves.filter(req => {
            // Search filter
            const searchStr = `${req.user.name} ${req.user.email} ${formatType(req.type)} ${req.reason}`.toLowerCase()
            if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) return false

            // Status filter
            if (statusFilter !== "ALL" && req.status !== statusFilter) return false

            // Date filter (check if range overlaps with request interval)
            if (dateRange?.from) {
                const rangeStart = startOfDay(dateRange.from)
                const rangeEnd = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)
                const reqStart = new Date(req.startDate)
                const reqEnd = new Date(req.endDate)

                // Overlap check: (StartDate1 <= EndDate2) and (EndDate1 >= StartDate2)
                const overlaps = reqStart <= rangeEnd && reqEnd >= rangeStart
                if (!overlaps) return false
            }

            return true
        })
    }, [initialLeaves, searchTerm, statusFilter, dateRange])

    const exportData = useMemo(() => {
        return filteredData.map(req => ({
            "Collaborateur": req.user.name || req.user.email,
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
        switch (status) {
            case 'APPROVED': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Accepté</Badge>;
            case 'REJECTED': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Refusé</Badge>;
            default: return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">En attente</Badge>;
        }
    };

    const formatDates = (req: LeaveRequestFull) => {
        const start = new Date(req.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const end = new Date(req.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        if (start === end) {
            return (
                <div className="flex flex-col">
                    <span className="font-medium text-foreground">{start}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{req.startAmPm}</span>
                </div>
            )
        }

        return (
            <div className="flex flex-col text-xs text-foreground">
                <span className="whitespace-nowrap"><span className="text-muted-foreground">Du</span> {start} <span className="text-[10px] text-muted-foreground uppercase">{req.startAmPm}</span></span>
                <span className="whitespace-nowrap"><span className="text-muted-foreground">Au</span> {end} <span className="text-[10px] text-muted-foreground uppercase">{req.endAmPm}</span></span>
            </div>
        )
    };

    return (
        <div className="flex flex-col">
            <TableActions
                data={exportData}
                onSearch={setSearchTerm}
                onStatusChange={setStatusFilter}
                onDateRangeChange={setDateRange}
                statusOptions={statusOptions}
                filename="conges_global"
                pdfTitle="Liste des Demandes de Congés"
            />

            <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left align-middle text-muted-foreground border-collapse min-w-[800px]">
                        <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-medium">Collaborateur</th>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Dates</th>
                                <th className="px-6 py-4 font-medium">Motif</th>
                                <th className="px-6 py-4 font-medium text-center">Statut</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground italic">
                                        {initialLeaves.length === 0 ? "Aucune demande." : "Aucun résultat pour ces filtres."}
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map(req => (
                                    <tr key={req.id} className="hover:bg-muted/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {req.user.image ? (
                                                    <img src={req.user.image} className="w-8 h-8 rounded-full bg-border object-cover" alt="" />
                                                ) : (
                                                    <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary font-semibold rounded-full border border-primary/20 text-xs">
                                                        {req.user.name?.charAt(0) || req.user.email?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground whitespace-nowrap leading-none">{req.user.name || "-"}</span>
                                                    <span className="text-[10px] text-muted-foreground mt-1.5">{req.user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium">{formatType(req.type)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {formatDates(req)}
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px]">
                                            <p className="text-xs text-muted-foreground truncate" title={req.reason || 'Aucun motif'}>
                                                {req.reason || '-'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status === 'PENDING' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    {loadingMap[req.id] ? (
                                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                                    ) : (
                                                        <>
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                onClick={() => handleAction(req.id, 'APPROVED')}
                                                                className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                                                title="Accepter"
                                                            >
                                                                <CheckCircle2 className="w-5 h-5" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                onClick={() => handleAction(req.id, 'REJECTED')}
                                                                className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                                title="Refuser"
                                                            >
                                                                <XCircle className="w-5 h-5" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase opacity-50">Clôturé</span>
                                            )}
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
