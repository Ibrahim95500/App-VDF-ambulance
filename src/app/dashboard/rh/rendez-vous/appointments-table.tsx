"use client"

import { useState, useMemo } from "react"
import { AppointmentRequest } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TablePagination } from "@/components/common/table-pagination"
import { TableActions } from "@/components/common/table-actions"
import { Loader2, CheckCircle2, XCircle, Eye, MessageSquareQuote, Search, Calendar, Phone, MapPin } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { isWithinInterval, startOfDay, endOfDay, format } from "date-fns"
import { fr } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { toast } from "sonner"
import { updateAppointmentStatus } from "@/actions/appointment-request.actions"

type RequestWithUser = AppointmentRequest & {
    user: {
        name: string | null
        email: string | null
        firstName: string | null
        lastName: string | null
        image: string | null
        phone: string | null
    }
}

export function AppointmentsTable({ initialData }: { initialData: RequestWithUser[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<RequestWithUser | null>(null)

    // Filtres
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("ALL")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [currentPage, setCurrentPage] = useState(1)
    const PAGE_SIZE = 10

    // Mode d'action RH (Approve / Reject)
    const [actionType, setActionType] = useState<'NONE' | 'APPROVED' | 'REJECTED'>('NONE')
    const [adminComment, setAdminComment] = useState("");
    const [appointmentDate, setAppointmentDate] = useState("");
    const [appointmentMode, setAppointmentMode] = useState("BUREAU");

    const filteredData = useMemo(() => {
        return initialData.filter(req => {
            const matchesSearch =
                (req.user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (req.user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (req.user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (req.reason?.toLowerCase() || '').includes(searchTerm.toLowerCase())

            const matchesStatus = statusFilter === "ALL" || req.status === statusFilter

            // Date filter
            let matchesDate = true
            if (dateRange?.from) {
                const reqDate = new Date(req.createdAt)
                const start = startOfDay(dateRange.from)
                const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)
                matchesDate = isWithinInterval(reqDate, { start, end })
            }

            return matchesSearch && matchesStatus && matchesDate
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [initialData, searchTerm, statusFilter, dateRange])

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return filteredData.slice(start, start + PAGE_SIZE)
    }, [filteredData, currentPage])

    const getStatusBadge = (status: string) => {
        if (status === 'APPROVED') return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Approuvé</Badge>
        if (status === 'REJECTED') return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Refusé</Badge>
        return <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">En attente</Badge>
    }

    const initiateAction = (req: RequestWithUser, type: 'APPROVED' | 'REJECTED') => {
        setSelectedRequest(req)
        setActionType(type)
        setAdminComment("")
        setAppointmentDate("")
        setAppointmentMode("BUREAU")
    }

    const confirmAction = async () => {
        if (!selectedRequest || actionType === 'NONE') return

        if (actionType === 'APPROVED') {
            if (!appointmentDate) {
                toast.error("Veuillez sélectionner une date et une heure pour le rendez-vous.")
                return
            }
        }

        try {
            setLoadingId(selectedRequest.id)
            const result = await updateAppointmentStatus(
                selectedRequest.id,
                actionType,
                adminComment || undefined,
                actionType === 'APPROVED' ? new Date(appointmentDate) : undefined,
                actionType === 'APPROVED' ? appointmentMode : undefined
            )

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Demande de rendez-vous ${actionType === 'APPROVED' ? 'approuvée (Email de confirmation planifié envoyé)' : 'refusée'}.`)
                setSelectedRequest(null)
                setActionType('NONE')
            }
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue")
        } finally {
            setLoadingId(null)
        }
    }

    const exportData = useMemo(() => {
        return filteredData.map(req => ({
            "Salarié": req.user.firstName && req.user.lastName ? `${req.user.firstName} ${req.user.lastName}` : (req.user.name || req.user.email),
            "Email": req.user.email,
            "Motif": req.reason || "-",
            "Date de demande": new Date(req.createdAt).toLocaleDateString('fr-FR'),
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
                filename="rendezvous_global"
                pdfTitle="Liste des Demandes de Rendez-vous"
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
                                <div className="flex items-center gap-3">
                                    {req.user.image ? (
                                        <img src={req.user.image} className="w-10 h-10 rounded-full border border-border object-cover" alt="" />
                                    ) : (
                                        <div className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary font-bold rounded-full border border-primary/20 text-sm">
                                            {req.user.firstName?.charAt(0) || req.user.name?.charAt(0) || req.user.email?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-foreground">
                                            {req.user.firstName && req.user.lastName ? `${req.user.firstName} ${req.user.lastName}` : (req.user.name || "-")}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{req.user.email}</span>
                                    </div>
                                </div>
                                {getStatusBadge(req.status)}
                            </div>

                            <div className="space-y-2 mb-4 bg-muted/30 p-3 rounded-lg border border-border/50">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Motif:</span>
                                    <span className="font-semibold text-foreground text-right">{req.reason}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Date:</span>
                                    <span className="font-medium text-foreground">
                                        {format(new Date(req.createdAt), 'dd MMM yyyy', { locale: fr })}
                                    </span>
                                </div>
                                {req.status === 'APPROVED' && req.appointmentDate && (
                                    <div className="flex justify-between text-sm border-t border-border/50 pt-2 mt-2">
                                        <span className="text-green-700 font-semibold">RDV Prévu:</span>
                                        <span className="font-bold text-green-700">
                                            {format(new Date(req.appointmentDate), "dd/MM/yyyy HH:mm")}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 bg-white"
                                    onClick={() => {
                                        setSelectedRequest(req)
                                        setActionType('NONE')
                                    }}
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Détails
                                </Button>
                                {req.status === 'PENDING' && (
                                    <>
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => initiateAction(req, 'APPROVED')}
                                            disabled={loadingId === req.id}
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Accepter
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                            onClick={() => initiateAction(req, 'REJECTED')}
                                            disabled={loadingId === req.id}
                                        >
                                            <XCircle className="w-4 h-4 mr-1.5" /> Refuser
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block rounded-xl border border-border bg-background overflow-hidden mt-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left align-middle text-muted-foreground">
                        <thead className="text-xs uppercase bg-muted/20 text-muted-foreground border-b border-border">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Salarié</th>
                                <th className="px-4 py-3 font-semibold">Motif</th>
                                <th className="px-4 py-3 font-semibold text-center">Date Demande</th>
                                <th className="px-4 py-3 font-semibold text-center">Statut</th>
                                <th className="px-4 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                                        Aucune demande de rendez-vous trouvée.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((req) => (
                                    <tr key={req.id} className="hover:bg-muted/10 transition-colors group">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {req.user.image ? (
                                                    <img src={req.user.image} className="w-8 h-8 rounded-full bg-border object-cover" alt="" />
                                                ) : (
                                                    <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary font-semibold rounded-full border border-primary/20 text-xs shrink-0">
                                                        {req.user.firstName?.charAt(0) || req.user.name?.charAt(0) || req.user.email?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-medium text-foreground leading-none">
                                                        {req.user.firstName && req.user.lastName
                                                            ? `${req.user.firstName} ${req.user.lastName}`
                                                            : req.user.name || "-"}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground mt-1 truncate">{req.user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-foreground">
                                            <div className="flex flex-col">
                                                <span className="max-w-[200px] truncate" title={req.reason || ""}>{req.reason}</span>
                                                {req.status === 'APPROVED' && req.appointmentDate && (
                                                    <span className="text-[10px] text-green-600 font-bold mt-0.5 whitespace-nowrap">
                                                        🗓️ {format(new Date(req.appointmentDate), "dd/MM/yyyy HH:mm")}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {format(new Date(req.createdAt), 'dd MMM yyyy', { locale: fr })}
                                        </td>
                                        <td className="px-4 py-3 text-center text-[11px]">
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                                    onClick={() => {
                                                        setSelectedRequest(req)
                                                        setActionType('NONE')
                                                    }}
                                                    title="Détails"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {req.status === 'PENDING' && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={() => initiateAction(req, 'APPROVED')}
                                                            disabled={loadingId === req.id}
                                                            title="Accepter"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => initiateAction(req, 'REJECTED')}
                                                            disabled={loadingId === req.id}
                                                            title="Refuser"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}
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

            {/* Read-Only or Action Dialog */}
            <Dialog
                open={!!selectedRequest}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedRequest(null)
                        setActionType('NONE')
                    }
                }}
            >
                <DialogContent className="max-w-[90vw] sm:max-w-xl border-border bg-background p-0 gap-0 overflow-y-auto max-h-[90vh]">
                    <DialogHeader className="p-5 bg-slate-900 text-white border-b border-slate-800">
                        <div className="flex justify-between items-start pr-8">
                            <div>
                                <div className="text-slate-400 text-[10px] mb-1 uppercase tracking-widest font-bold">
                                    Demande de Rendez-vous
                                </div>
                                <DialogTitle className="text-lg font-black text-white leading-tight">
                                    {selectedRequest?.reason}
                                </DialogTitle>
                                <DialogDescription className="text-slate-400 text-xs mt-1">
                                    Par {selectedRequest?.user.firstName && selectedRequest?.user.lastName ? `${selectedRequest?.user.firstName} ${selectedRequest?.user.lastName}` : selectedRequest?.user.email} • le {selectedRequest ? format(new Date(selectedRequest.createdAt), 'dd MMMM yyyy', { locale: fr }) : ''}
                                </DialogDescription>
                            </div>
                            {selectedRequest && getStatusBadge(selectedRequest.status)}
                        </div>
                    </DialogHeader>

                    <div className="p-5 space-y-6">
                        {/* Context & Description */}
                        {selectedRequest?.description && (
                            <div className="space-y-2">
                                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Description de la demande</span>
                                <p className="text-sm text-foreground p-3.5 bg-muted/40 rounded-lg border border-border/50 text-justify">
                                    {selectedRequest.description}
                                </p>
                            </div>
                        )}

                        {/* Existing Admin Comments or Rendezvous details (if already processed) */}
                        {actionType === 'NONE' && selectedRequest?.status !== 'PENDING' && (
                            <>
                                {selectedRequest?.status === 'APPROVED' && selectedRequest.appointmentDate && (
                                    <div className="bg-green-50/50 rounded-xl p-4 border border-green-200">
                                        <h4 className="text-xs uppercase text-green-700 font-bold tracking-wider mb-3">Détails du Rendez-vous validé</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center size-8 rounded-full bg-green-100 text-green-600">
                                                    <Calendar className="size-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase text-green-600/70 font-semibold mb-0.5">Date et Heure</span>
                                                    <span className="text-xs font-bold text-green-800">
                                                        {format(new Date(selectedRequest.appointmentDate), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center size-8 rounded-full bg-blue-100 text-blue-600">
                                                    {selectedRequest.appointmentMode === 'TELEPHONE' ? <Phone className="size-4" /> : <MapPin className="size-4" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase text-blue-600/70 font-semibold mb-0.5">Mode d'entretien</span>
                                                    <span className="text-xs font-bold text-blue-800">
                                                        {selectedRequest.appointmentMode === 'TELEPHONE' ? 'Par Téléphone' : 'Au Bureau'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {selectedRequest?.adminComment && (
                                    <div className="space-y-2 pt-4 border-t border-border">
                                        <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-1.5">
                                            <MessageSquareQuote className="w-3.5 h-3.5" /> Commentaire RH transmis
                                        </span>
                                        <p className="text-sm p-3.5 rounded-lg border italic bg-muted/80 text-foreground border-border/80 text-justify">
                                            "{selectedRequest.adminComment}"
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Action Area (If user clicked Approve/Reject) */}
                        {actionType !== 'NONE' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className={`p-5 rounded-xl border ${actionType === 'APPROVED' ? 'bg-green-50/50 border-green-200 shadow-sm shadow-green-100/20' : 'bg-red-50/50 border-red-200 shadow-sm shadow-red-100/20'
                                    }`}>
                                    <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${actionType === 'APPROVED' ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                        {actionType === 'APPROVED' ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                                        {actionType === 'APPROVED' ? "Fixer le Rendez-vous" : "Refuser la demande"}
                                    </h3>

                                    <div className="space-y-4">
                                        {actionType === 'APPROVED' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-green-900">Date et Heure *</label>
                                                    <Input
                                                        type="datetime-local"
                                                        required
                                                        value={appointmentDate}
                                                        onChange={(e) => setAppointmentDate(e.target.value)}
                                                        className="bg-white text-gray-900 border-green-200 focus-visible:ring-green-500"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-green-900">Mode d'entretien *</label>
                                                    <Select value={appointmentMode} onValueChange={setAppointmentMode}>
                                                        <SelectTrigger className="bg-white text-gray-900 border-green-200 focus:ring-green-500">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="BUREAU">Au Bureau</SelectItem>
                                                            <SelectItem value="TELEPHONE">Par Téléphone</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className={`text-xs font-semibold ${actionType === 'APPROVED' ? 'text-green-900' : 'text-red-900'}`}>
                                                Ajouter un commentaire (Optionnel)
                                            </label>
                                            <Textarea
                                                placeholder={actionType === 'APPROVED' ? "Ex: Veuillez préparer vos documents." : "Ex: Ce motif nécessite d'en parler préalablement avec votre manager."}
                                                className={`min-h-[80px] bg-white text-gray-900 resize-none ${actionType === 'APPROVED' ? 'border-green-200 focus-visible:ring-green-500' : 'border-red-200 focus-visible:ring-red-500'
                                                    }`}
                                                value={adminComment}
                                                onChange={(e) => setAdminComment(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex gap-2 pt-2 justify-end">
                                            <Button
                                                variant="outline"
                                                type="button"
                                                onClick={() => setActionType('NONE')}
                                                disabled={loadingId === selectedRequest?.id}
                                                className="bg-white"
                                            >
                                                Annuler
                                            </Button>
                                            <Button
                                                onClick={confirmAction}
                                                disabled={loadingId === selectedRequest?.id || (actionType === 'APPROVED' && !appointmentDate)}
                                                className={actionType === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                                            >
                                                {loadingId === selectedRequest?.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : (
                                                    actionType === 'APPROVED' ? 'Confirmer le Rendez-vous' : 'Confirmer le refus'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {actionType === 'NONE' && selectedRequest?.status === 'PENDING' && (
                            <div className="flex gap-2 pt-2 border-t border-border mt-4">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={() => setActionType('APPROVED')}
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Accepter
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => setActionType('REJECTED')}
                                >
                                    <XCircle className="w-4 h-4 mr-1.5" /> Refuser
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
