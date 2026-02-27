"use client"

import { useState, useMemo } from "react"
import { GlobalServiceRequest } from "@/services/service-request"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    CheckCircle2,
    XCircle,
    Eye,
    Mail,
    Smartphone,
    Layout,
    Clock,
    AlertCircle
} from "lucide-react"
import { updateServiceRequestStatus } from "@/actions/service-request.actions"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { TableActions } from "@/components/common/table-actions"
import { isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { DateRange } from "react-day-picker"

export function RHServiceRequestsTable({ initialData }: { initialData: GlobalServiceRequest[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<GlobalServiceRequest | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()

    const handleUpdateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
        try {
            setLoadingId(id)
            await updateServiceRequestStatus(id, status)
            toast.success(`Demande ${status === 'APPROVED' ? 'approuvée' : 'refusée'} avec succès`)
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue")
        } finally {
            setLoadingId(null)
        }
    }

    const filteredData = useMemo(() => {
        return initialData.filter(req => {
            // Search filter
            const searchStr = `${req.user.firstName} ${req.user.lastName} ${req.user.email} ${req.subject} ${req.description}`.toLowerCase()
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
            "Collaborateur": `${req.user.firstName} ${req.user.lastName}`,
            "Email": req.user.email,
            "Catégorie": req.category,
            "Sujet": req.subject,
            "Source": req.source,
            "Date": new Date(req.createdAt).toLocaleDateString('fr-FR'),
            "Statut": req.status === 'PENDING' ? 'En Attente' : req.status === 'APPROVED' ? 'Approuvé' : 'Refusé'
        }))
    }, [filteredData])

    const statusOptions = [
        { label: "En Attente", value: "PENDING" },
        { label: "Approuvé", value: "APPROVED" },
        { label: "Refusé", value: "REJECTED" }
    ]

    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'WHATSAPP': return <Smartphone className="size-3.5 text-green-600" />
            case 'EMAIL': return <Mail className="size-3.5 text-blue-500" />
            default: return <Layout className="size-3.5 text-gray-400" />
        }
    }

    return (
        <div className="flex flex-col">
            <TableActions
                data={exportData}
                onSearch={setSearchTerm}
                onStatusChange={setStatusFilter}
                onDateRangeChange={setDateRange}
                statusOptions={statusOptions}
                filename="services_global"
                pdfTitle="Liste des Demandes de Service"
            />

            <div className="overflow-x-auto border border-border rounded-xl w-full">
                <table className="w-full text-sm text-left align-middle text-muted-foreground border-collapse min-w-[800px]">
                    <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                        <tr>
                            <th scope="col" className="px-4 py-3 font-semibold">Collaborateur</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Catégorie</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Sujet</th>
                            <th scope="col" className="px-4 py-3 font-semibold text-center">Source</th>
                            <th scope="col" className="px-4 py-3 font-semibold text-center">Date</th>
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
                                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                                                {(req.user.firstName?.[0] || 'U')}{(req.user.lastName?.[0] || '')}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground leading-none">{req.user.firstName} {req.user.lastName}</span>
                                                <span className="text-[10px] text-muted-foreground mt-1">{req.user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-[10px] font-bold uppercase bg-muted/30 border-border">
                                            {req.category}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 max-w-[150px] truncate font-medium text-foreground">
                                        {req.subject}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center">
                                            <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-0.5 border-border bg-background">
                                                {getSourceIcon(req.source)}
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{req.source}</span>
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col items-center">
                                            <div className="font-semibold text-foreground">{new Date(req.createdAt).toLocaleDateString('fr-FR')}</div>
                                            <div className="text-[10px] opacity-60 flex items-center gap-1"><Clock className="size-2.5" /> {new Date(req.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end items-center gap-1.5">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="size-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => setSelectedRequest(req)}>
                                                        <Eye className="size-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[500px] border-border shadow-2xl p-0 overflow-hidden bg-background">
                                                    <DialogHeader className="p-6 bg-slate-900 text-white">
                                                        <div className="flex items-center gap-2 text-slate-400 text-[10px] mb-2 uppercase tracking-widest font-bold">
                                                            <Layout className="size-3" /> Demande de Service • {req.category}
                                                        </div>
                                                        <DialogTitle className="text-xl font-black italic">{req.subject}</DialogTitle>
                                                        <DialogDescription className="text-slate-400 text-xs">
                                                            Postée le {new Date(req.createdAt).toLocaleDateString('fr-FR')} par {req.user.firstName} {req.user.lastName}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="p-8 space-y-6">
                                                        <div className="space-y-3">
                                                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                                <AlertCircle className="size-3" /> Description de la demande
                                                            </h4>
                                                            <div className="p-5 bg-muted/30 rounded-xl text-foreground text-sm leading-relaxed border border-border italic">
                                                                {req.description}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                                                            <Button
                                                                variant="outline"
                                                                className="flex-1 h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-xs"
                                                                disabled={loadingId === req.id}
                                                                onClick={() => handleUpdateStatus(req.id, "REJECTED")}
                                                            >
                                                                <XCircle className="mr-2 size-4" /> Refuser
                                                            </Button>
                                                            <Button
                                                                className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-lg shadow-green-200"
                                                                disabled={loadingId === req.id}
                                                                onClick={() => handleUpdateStatus(req.id, "APPROVED")}
                                                            >
                                                                <CheckCircle2 className="mr-2 size-4" /> Approuver
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>

                                            {req.status === 'PENDING' ? (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="size-8 text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700 shadow-sm"
                                                        disabled={loadingId === req.id}
                                                        onClick={() => handleUpdateStatus(req.id, "APPROVED")}
                                                    >
                                                        <CheckCircle2 className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="size-8 text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700 shadow-sm"
                                                        disabled={loadingId === req.id}
                                                        onClick={() => handleUpdateStatus(req.id, "REJECTED")}
                                                    >
                                                        <XCircle className="size-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <Badge variant="outline" className={`
                                                    text-[10px] font-bold px-2 py-0.5 border-none
                                                    ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                                                `}>
                                                    {req.status === 'APPROVED' ? 'APPROUVÉE' : 'REFUSÉE'}
                                                </Badge>
                                            )}
                                        </div>
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
