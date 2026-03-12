"use client"

import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableActions } from "@/components/common/table-actions"
import { TablePagination } from "@/components/common/table-pagination"
import { isWithinInterval, startOfDay, endOfDay, format } from "date-fns"
import { fr } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { deactivateUser, reactivateUser, decrementOubliCount } from "@/actions/users"
import { toast } from "sonner"
import { Trash2Icon, InfoIcon, ShieldCheckIcon, ShieldAlertIcon, UserCheckIcon, UserXIcon, MessageSquareIcon, Eye, RotateCcw, Calendar, Loader2, Pen } from "lucide-react"
import { HRStatsCharts } from "../components/hr-stats-charts"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createConvocationAction } from "@/actions/appointment-request.actions"
import { EditCollaboratorForm } from "../components/edit-collaborator-form"

interface User {
    id: string
    name: string | null
    email: string | null
    image: string | null
    roles: string[]
    createdAt?: Date | string | null
    firstName: string | null
    lastName: string | null
    phone: string | null
    birthDate: Date | null
    isActive?: boolean
    deletionReason?: string | null
    oubliCount?: number
    structure?: string | null
    diploma?: string | null
    shift?: string | null
    preference?: string | null
    isTeamLeader?: boolean
    isRegulateur?: boolean
}

export function CollaboratorsTable({ initialData, services = [] }: { initialData: User[], services?: any[] }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState("ALL")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [currentPage, setCurrentPage] = useState(1)
    const PAGE_SIZE = 10

    useEffect(() => { setCurrentPage(1) }, [searchTerm, roleFilter, statusFilter, dateRange])

    // Deactivation state
    const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null)
    const [reason, setReason] = useState("")
    const [isDeactivating, setIsDeactivating] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [isReactivating, setIsReactivating] = useState<string | null>(null)
    const [isReducingOubli, setIsReducingOubli] = useState(false)

    // Convocation state
    const [isConvoking, setIsConvoking] = useState(false)
    const [convocReason, setConvocReason] = useState("")
    const [convocDate, setConvocDate] = useState("")
    const [convocMode, setConvocMode] = useState("BUREAU")
    const [convocDesc, setConvocDesc] = useState("")
    const [convocSubmitting, setConvocSubmitting] = useState(false)

    const reasonOptions = [
        "Point d'étape / Bilan",
        "Incident de transport",
        "Avertissement ou Sanction",
        "Gestion d'un conflit",
        "Évaluation annuelle",
        "Retour d'arrêt maladie",
        "Modification du contrat",
        "Autre métier"
    ];

    const handleConvocation = async () => {
        if (!selectedUser || !convocReason || !convocDate) {
            toast.error("Veuillez remplir les champs: Motif et Date.");
            return;
        }
        try {
            setConvocSubmitting(true);
            const result = await createConvocationAction(selectedUser.id, convocReason, new Date(convocDate), convocMode, convocDesc);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Convocation envoyée avec succès.");
                setIsConvoking(false);
                setConvocReason(""); setConvocDate(""); setConvocMode("BUREAU"); setConvocDesc("");
            }
        } catch {
            toast.error("Une erreur est survenue.");
        } finally {
            setConvocSubmitting(false);
        }
    }

    const userStats = useMemo(() => {
        if (!selectedUser) return null;
        const userServices = services.filter(s => s.userId === selectedUser.id);
        const categoryCounts: Record<string, number> = {}
        const monthCounts: Record<string, number> = {}

        const sortedServices = [...userServices].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        sortedServices.forEach(req => {
            const cat = req.category || 'Non catégorisé'
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
            const date = new Date(req.createdAt)
            const monthYearStr = format(date, 'MMM yyyy', { locale: fr })
            const monthYear = monthYearStr.charAt(0).toUpperCase() + monthYearStr.slice(1)
            monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1
        })

        return {
            requestsByCategory: Object.entries(categoryCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
            requestsByMonth: Object.keys(monthCounts).map(name => ({ name, value: monthCounts[name] }))
        }
    }, [selectedUser, services]);

    const filteredData = useMemo(() => {
        return initialData.filter(user => {
            // Search filter
            const searchStr = `${user.name} ${user.email} ${user.firstName} ${user.lastName} ${user.phone}`.toLowerCase()
            if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) return false

            // Role filter
            if (roleFilter !== "ALL" && !user.roles?.includes(roleFilter)) return false

            // Active/Inactive filter
            if (statusFilter !== "ALL") {
                const isActive = (user as any).isActive !== false
                if (statusFilter === "ACTIVE" && !isActive) return false
                if (statusFilter === "INACTIVE" && isActive) return false
            }

            // Date filter (Creation date)
            if (dateRange?.from && user.createdAt) {
                const userDate = new Date(user.createdAt)
                const start = startOfDay(dateRange.from)
                const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)
                if (!isWithinInterval(userDate, { start, end })) return false
            }

            return true
        })
    }, [initialData, searchTerm, roleFilter, statusFilter, dateRange])

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return filteredData.slice(start, start + PAGE_SIZE)
    }, [filteredData, currentPage])

    const exportData = useMemo(() => {
        return filteredData.map(user => ({
            "Nom": user.lastName || "-",
            "Prénom": user.firstName || "-",
            "Email": user.email,
            "Téléphone": user.phone || "-",
            "Rôle": user.roles?.includes('RH') ? 'RH / Admin' : 'Salarié',
            "Statut": (user as any).isActive !== false ? 'Actif' : 'Inactif',
            "Motif Désactivation": (user as any).deletionReason || "-",
            "Date d'inscription": user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'
        }))
    }, [filteredData])

    const roleOptions = [
        { label: "Salariés", value: "SALARIE" },
        { label: "RH / Admin", value: "RH" }
    ]

    const filterCounts = useMemo(() => {
        const counts = { ALL: initialData.length, SALARIE: 0, RH: 0 }
        initialData.forEach(user => {
            if (user.roles?.includes('SALARIE')) counts.SALARIE++
            if (user.roles?.includes('RH')) counts.RH++
        })
        return counts
    }, [initialData])

    const handleDeactivate = async () => {
        if (!userToDeactivate || !reason.trim()) {
            toast.error("Veuillez saisir un motif de désactivation.")
            return
        }

        setIsDeactivating(true)
        try {
            console.log("Attempting deactivation for:", userToDeactivate.id, "Reason:", reason);
            const result = await deactivateUser(userToDeactivate.id, reason)
            if (result.success) {
                toast.success(result.success)
                setUserToDeactivate(null)
                setReason("")
            } else if (result.error) {
                toast.error(result.error)
            }
        } catch (error) {
            console.error("Deactivation error details:", error);
            toast.error("Une erreur s'est produite lors de la désactivation.")
        } finally {
            setIsDeactivating(false)
        }
    }

    const handleReactivate = async (userId: string) => {
        setIsReactivating(userId)
        try {
            const result = await reactivateUser(userId)
            if (result.success) toast.success(result.success)
            else if (result.error) toast.error(result.error)
        } catch {
            toast.error("Une erreur s'est produite lors de la réactivation.")
        } finally {
            setIsReactivating(null)
        }
    }

    const handleReduceOubli = async () => {
        if (!selectedUser) return;
        setIsReducingOubli(true);
        try {
            const result = await decrementOubliCount(selectedUser.id);
            if (result.success) {
                toast.success(result.success);
                // Mise à jour locale de l'objet selectedUser s'il existe
                setSelectedUser({ ...selectedUser, oubliCount: Math.max(0, (selectedUser.oubliCount || 0) - 1) });
            } else if (result.error) {
                toast.error(result.error);
            }
        } catch {
            toast.error("Erreur lors de la réduction des oublis.");
        } finally {
            setIsReducingOubli(false);
        }
    }

    const activeCount = initialData.filter(u => (u as any).isActive !== false).length
    const inactiveCount = initialData.length - activeCount

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-4">
                <Badge variant="outline" className="px-4 py-2 bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-2">
                    <UserCheckIcon className="w-4 h-4" />
                    <span className="font-bold">{activeCount}</span> Collaborateurs Actifs
                </Badge>
                <Badge variant="outline" className="px-4 py-2 bg-red-50 text-red-700 border-red-200 flex items-center gap-2">
                    <UserXIcon className="w-4 h-4" />
                    <span className="font-bold">{inactiveCount}</span> Collaborateurs Inactifs
                </Badge>
            </div>

            <div className="border border-border rounded-xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <div className="flex-1">
                        <TableActions
                            data={exportData}
                            onSearch={setSearchTerm}
                            onStatusChange={setRoleFilter}
                            onDateRangeChange={setDateRange}
                            statusOptions={roleOptions}
                            counts={filterCounts}
                            filename="collaborateurs_vdf"
                            pdfTitle="Liste des Collaborateurs - VDF Ambulance"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Filtrer par compte :</span>
                        <div className="flex bg-muted p-1 rounded-lg">
                            <button
                                onClick={() => setStatusFilter("ALL")}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${statusFilter === "ALL" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                Tous
                            </button>
                            <button
                                onClick={() => setStatusFilter("ACTIVE")}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${statusFilter === "ACTIVE" ? "bg-background shadow-sm text-green-600" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                Actifs
                            </button>
                            <button
                                onClick={() => setStatusFilter("INACTIVE")}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${statusFilter === "INACTIVE" ? "bg-background shadow-sm text-red-600" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                Inactifs
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden border border-border rounded-xl overflow-hidden divide-y divide-border">
                {filteredData.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground italic">
                        {initialData.length === 0 ? "Aucun collaborateur." : "Aucun résultat pour ces filtres."}
                    </div>
                ) : paginatedData.map((user) => (
                    <div key={user.id} className={`p-4 flex gap-3 items-start hover:bg-muted/5 transition-colors ${(user as any).isActive === false ? 'bg-red-50/20' : ''}`}>
                        {user.image ? (
                            <img src={user.image} className="w-10 h-10 rounded-full object-cover shrink-0 border border-border" alt="" />
                        ) : (
                            <div className={`size-10 rounded-full font-bold flex items-center justify-center shrink-0 border text-sm ${(user as any).isActive === false ? 'bg-red-100 text-red-600 border-red-200' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                {user.firstName?.charAt(0) || user.email?.charAt(0) || '?'}
                            </div>
                        )}
                        <div className="flex flex-col grow gap-1.5 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className={`font-bold text-sm truncate flex items-center ${(user as any).isActive === false ? 'text-red-700' : 'text-foreground'}`}>
                                        {(user.firstName || user.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (user.name || "-")}
                                        {(user.oubliCount ?? 0) >= 3 && (
                                            <span className="ml-2 inline-flex items-center text-[9px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded shadow-sm shadow-red-200 tracking-wider">🚨 3 OUBLIS</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                                <div className="flex items-center gap-1 flex-wrap justify-end">
                                    {(user.roles || []).map((role: string) => (
                                        <Badge key={role} variant="outline" className={`text-[10px] font-bold shrink-0 ${role === 'RH' ? 'text-purple-600 bg-purple-50 border-purple-200' : 'text-secondary bg-secondary/10 border-secondary/20'}`}>
                                            {role === 'RH' ? 'RH' : role}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                {(user as any).isActive !== false ? (
                                    <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">ACTIF</span>
                                ) : (
                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">INACTIF</span>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <Button variant="ghost" size="icon" className="size-7 text-blue-500 hover:bg-blue-50" onClick={() => setSelectedUser(user)}>
                                        <Eye className="size-3.5" />
                                    </Button>
                                    {(user as any).isActive !== false ? (
                                        <Button size="sm" variant="ghost" className="h-7 text-[11px] text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setUserToDeactivate(user as any)}>
                                            Suspendre
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="ghost" className="h-7 text-[11px] text-green-600 hover:text-green-700 hover:bg-green-50" disabled={isReactivating === user.id} onClick={() => handleReactivate(user.id)}>
                                            <RotateCcw className="size-3 mr-1" />
                                            Réactiver
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto border border-border rounded-xl w-full">
                <table className="w-full text-sm text-left align-middle text-muted-foreground min-w-[800px]">
                    <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                        <tr>
                            <th scope="col" className="px-4 py-3 font-semibold">Collaborateur</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Contact</th>
                            <th scope="col" className="px-4 py-3 font-semibold text-center">Rôle</th>
                            <th scope="col" className="px-4 py-3 font-semibold text-center">Statut Compte</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Commentaire / Motif</th>
                            <th scope="col" className="px-4 py-3 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">
                                    {initialData.length === 0 ? "Aucun collaborateur trouvé." : "Aucun résultat pour ces filtres."}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((user) => (
                                <tr key={user.id} className={`hover:bg-muted/10 transition-colors ${(user as any).isActive === false ? 'bg-red-50/20' : ''}`}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-4">
                                            {user.image ? (
                                                <img src={user.image} className="w-10 h-10 rounded-full bg-border object-cover border border-border" alt="" />
                                            ) : (
                                                <div className={`w-10 h-10 flex items-center justify-center font-bold rounded-full border text-sm ${(user as any).isActive === false ? 'bg-red-100 text-red-600 border-red-200' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                                    {user.firstName?.charAt(0) || user.email?.charAt(0) || '?'}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className={`font-bold text-base leading-tight ${(user as any).isActive === false ? 'text-red-700' : 'text-foreground'}`}>
                                                    {(user.firstName || user.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (user.name || "-")}
                                                </span>
                                                {(user.oubliCount ?? 0) >= 3 && (
                                                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded w-fit shadow-sm shadow-red-100">
                                                        <ShieldAlertIcon className="w-3 h-3" /> ALERTE : 3 OUBLIS ATTEINTS
                                                    </span>
                                                )}
                                                <span className="text-[11px] text-muted-foreground mt-1 underline decoration-primary/30">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-foreground font-medium">{user.phone || "Non renseigné"}</span>
                                            {user.birthDate && (
                                                <span className="text-[10px] text-muted-foreground">Né(e) le {new Date(user.birthDate).toLocaleDateString('fr-FR')}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                            {(user.roles || []).map((role: string) => (
                                                <Badge key={role} variant="outline" className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${role === 'RH' ? 'text-purple-600 bg-purple-50 border-purple-200' : 'text-secondary bg-secondary/10 border-secondary/20'}`}>
                                                    {role === 'RH' ? 'RH / Admin' : role}
                                                </Badge>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        {(user as any).isActive !== false ? (
                                            <div className="flex items-center justify-center gap-1.5 text-green-600 font-bold text-[10px] bg-green-50 border border-green-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                                                <ShieldCheckIcon className="w-3 h-3" />
                                                <span>ACTIF</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-1.5 text-red-600 font-bold text-[10px] bg-red-50 border border-red-200 rounded-full px-2 py-0.5 whitespace-nowrap mx-auto">
                                                <ShieldAlertIcon className="w-3 h-3" />
                                                <span>INACTIF</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {(user as any).isActive === false && (user as any).deletionReason ? (
                                            <div className="flex items-start gap-2 max-w-[200px]">
                                                <MessageSquareIcon className="w-3.5 h-3.5 text-red-400 mt-1 flex-shrink-0" />
                                                <p className="text-xs text-red-700 font-medium leading-normal italic">
                                                    {(user as any).deletionReason}
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground italic">-</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button variant="ghost" size="icon" className="size-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => setSelectedUser(user)}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {(user as any).isActive !== false ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    onClick={() => setUserToDeactivate(user)}
                                                >
                                                    <Trash2Icon className="w-4 h-4 mr-1.5" />
                                                    Suspendre
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
                                                    disabled={isReactivating === user.id}
                                                    onClick={() => handleReactivate(user.id)}
                                                >
                                                    <RotateCcw className="w-4 h-4 mr-1.5" />
                                                    Réactiver
                                                </Button>
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

            {/* Deactivation Dialog */}
            <Dialog open={!!userToDeactivate} onOpenChange={(open) => !open && setUserToDeactivate(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2 text-xl">
                            <Trash2Icon className="w-6 h-6" />
                            Suspendre l'accès
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-foreground font-medium">
                            Vous êtes sur le point de désactiver l'accès de :<br />
                            <span className="text-lg font-bold block mt-1 text-red-700">{userToDeactivate?.firstName} {userToDeactivate?.lastName}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="reason" className="text-sm font-bold text-muted-foreground uppercase tracking-tight block">
                                Justification de la suspension (Obligatoire)
                            </label>
                            <Textarea
                                id="reason"
                                placeholder="Indiquez la raison (ex: fin de contrat, suspension temporaire...). Min 5 caractères."
                                className="min-h-[120px] border-border focus:border-red-500 focus:ring-red-500/20 text-sm"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex sm:justify-between items-center gap-3 border-t pt-5 mt-2">
                        <Button variant="ghost" onClick={() => setUserToDeactivate(null)} className="font-semibold text-muted-foreground hover:text-foreground">
                            Annuler
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white font-bold h-11 px-6 shadow-lg shadow-red-200"
                            onClick={handleDeactivate}
                            disabled={isDeactivating || !reason.trim() || reason.trim().length < 5}
                        >
                            {isDeactivating ? "Suspension en cours..." : "Confirmer la suspension"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => {
                if (!open) {
                    setSelectedUser(null);
                    setIsEditingProfile(false);
                    setIsConvoking(false);
                }
            }}>
                <DialogContent className="max-w-[90vw] sm:max-w-xl border-border bg-background p-0 gap-0 overflow-y-auto max-h-[90vh] pb-8">
                    <DialogHeader className="p-0 m-0">
                        <DialogTitle className="sr-only">Détails de {selectedUser?.firstName} {selectedUser?.lastName}</DialogTitle>
                    </DialogHeader>
                    <div className="p-5 bg-slate-900 text-white">
                        <div className="flex items-center gap-3">
                            {selectedUser?.image ? (
                                <img src={selectedUser.image} className="w-12 h-12 rounded-full object-cover border-2 border-white/20" alt="" />
                            ) : (
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 ${(selectedUser as any)?.isActive === false ? 'bg-red-100/20 text-red-300 border-red-300/30' : 'bg-white/10 text-white border-white/20'}`}>
                                    {selectedUser?.firstName?.charAt(0) || selectedUser?.email?.charAt(0) || '?'}
                                </div>
                            )}
                            <div>
                                <p className="font-black text-base flex items-center">
                                    {selectedUser?.firstName} {selectedUser?.lastName}
                                    {(selectedUser?.oubliCount ?? 0) >= 3 && (
                                        <span className="ml-3 inline-flex items-center text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded shadow-sm tracking-wide">
                                            🚨 3 OUBLIS
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-slate-400">{selectedUser?.email}</p>
                            </div>
                        </div>
                    </div>
                    {isEditingProfile && selectedUser ? (
                        <div className="p-5">
                            <h3 className="font-bold text-lg text-secondary border-b border-border pb-2 mb-4">Modifier le profil et accès</h3>
                            <EditCollaboratorForm
                                user={selectedUser}
                                onCancel={() => setIsEditingProfile(false)}
                                onSuccess={() => { setIsEditingProfile(false); setSelectedUser(null); }}
                            />
                        </div>
                    ) : (
                        <div className="p-5 space-y-3">
                            <div className="flex justify-end mb-2">
                                <Button onClick={() => setIsEditingProfile(true)} size="sm" variant="outline" className="bg-primary/5 text-primary hover:bg-primary/10 border-transparent shadow-none"><Pen className="w-4 h-4 mr-1.5" /> Modifier les accès</Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Rôles</span>
                                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                    {(selectedUser?.roles || []).map((role: string) => (
                                        <Badge key={role} variant="outline" className={role === 'RH' ? "text-purple-600 bg-purple-50 border-purple-200" : "text-secondary bg-secondary/10 border-secondary/20"}>
                                            {role === 'RH' ? 'RH / Admin' : role}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Statut</span>
                                {(selectedUser as any)?.isActive !== false ? (
                                    <div className="flex items-center gap-1.5 text-green-600 text-[10px] font-bold bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                                        <ShieldCheckIcon className="w-3 h-3" /> ACTIF
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-red-600 text-[10px] font-bold bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                                        <ShieldAlertIcon className="w-3 h-3" /> INACTIF
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Oublis de validation</span>
                                <div className="flex items-center gap-3">
                                    <Badge variant={(selectedUser?.oubliCount ?? 0) >= 3 ? "destructive" : "outline"} className="font-bold">
                                        {selectedUser?.oubliCount ?? 0} { (selectedUser?.oubliCount ?? 0) > 1 ? "oublis" : "oubli" }
                                    </Badge>
                                    {(selectedUser?.oubliCount ?? 0) > 0 && (
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-7 text-[10px] text-blue-600 hover:bg-blue-50 border border-blue-100"
                                            onClick={handleReduceOubli}
                                            disabled={isReducingOubli}
                                        >
                                            {isReducingOubli ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RotateCcw className="w-3 h-3 mr-1" />}
                                            Réduire de 1
                                        </Button>
                                    )}
                                </div>
                            </div>
                            {selectedUser?.phone && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Téléphone</span>
                                    <span className="text-sm font-medium">{selectedUser.phone}</span>
                                </div>
                            )}
                            {selectedUser?.birthDate && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Date de naissance</span>
                                    <span className="text-sm font-medium">{new Date(selectedUser.birthDate).toLocaleDateString('fr-FR')}</span>
                                </div>
                            )}
                            {(selectedUser as any)?.deletionReason && (
                                <div className="space-y-1">
                                    <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Motif de suspension</span>
                                    <p className="text-sm text-red-700 p-3 bg-red-50 rounded-lg border border-red-200 italic">
                                        {(selectedUser as any).deletionReason}
                                    </p>
                                </div>
                            )}

                            {!isConvoking && selectedUser?.roles?.includes('SALARIE') && (selectedUser as any)?.isActive !== false && (
                                <div className="pt-4 border-t border-border">
                                    {selectedUser.oubliCount && selectedUser.oubliCount >= 3 && (
                                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-xs font-bold text-red-800 flex items-center gap-1.5 mb-1"><ShieldAlertIcon className="w-4 h-4"/> Action Requise Absolue</p>
                                            <p className="text-[11px] text-red-600 leading-tight">Ce collaborateur a atteint 3 oublis de validation de planification à la régulation. Vous devez procéder à l'envoi d'une convocation RH ci-dessous.</p>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setIsConvoking(true)}
                                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-bold transition-all shadow-sm ${selectedUser.oubliCount && selectedUser.oubliCount >= 3 ? 'bg-red-600 text-white border-red-700 hover:bg-red-700 hover:shadow-red-200 shadow-md' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                                    >
                                        <Calendar className="w-4 h-4" /> Convoquer ce salarié
                                    </button>
                                </div>
                            )}

                            {isConvoking && (
                                <div className="pt-4 border-t border-border space-y-3 animate-in fade-in duration-200">
                                    <p className="text-xs font-bold uppercase text-blue-700 tracking-wider">Nouvelle Convocation</p>
                                    <Select value={convocReason} onValueChange={setConvocReason} disabled={convocSubmitting}>
                                        <SelectTrigger className="text-sm"><SelectValue placeholder="Motif *" /></SelectTrigger>
                                        <SelectContent>
                                            {reasonOptions.map((r, i) => <SelectItem key={i} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="datetime-local"
                                        value={convocDate}
                                        onChange={(e) => setConvocDate(e.target.value)}
                                        className="text-sm [&::-webkit-calendar-picker-indicator]:dark:invert-0"
                                        style={{ colorScheme: 'light' }}
                                        disabled={convocSubmitting}
                                    />
                                    <Select value={convocMode} onValueChange={setConvocMode} disabled={convocSubmitting}>
                                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BUREAU">Au Bureau</SelectItem>
                                            <SelectItem value="TELEPHONE">Par Téléphone</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Textarea placeholder="Message pour le salarié (Optionnel)" value={convocDesc} onChange={(e) => setConvocDesc(e.target.value)} className="min-h-[80px] resize-none text-sm" disabled={convocSubmitting} />
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="outline" size="sm" onClick={() => setIsConvoking(false)} disabled={convocSubmitting} className="border-slate-300 text-slate-700 font-medium">Annuler</Button>
                                        <Button size="sm" onClick={handleConvocation} disabled={convocSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                            {convocSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Calendar className="w-4 h-4 mr-1" />}
                                            Envoyer
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {userStats && (userStats.requestsByCategory.length > 0 || userStats.requestsByMonth.length > 0) && (
                                <div className="pt-4 mt-4 border-t border-border">
                                    <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-2 block">Statistiques Personnelles</span>
                                    <HRStatsCharts
                                        requestsByCategory={userStats.requestsByCategory}
                                        requestsByUser={[]}
                                        requestsByMonth={userStats.requestsByMonth}
                                        hideUserTab
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

