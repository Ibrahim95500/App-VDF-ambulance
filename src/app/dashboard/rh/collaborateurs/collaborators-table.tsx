"use client"

import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableActions } from "@/components/common/table-actions"
import { TablePagination } from "@/components/common/table-pagination"
import { isWithinInterval, startOfDay, endOfDay } from "date-fns"
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
import { deactivateUser, reactivateUser } from "@/actions/users"
import { toast } from "sonner"
import { Trash2Icon, InfoIcon, ShieldCheckIcon, ShieldAlertIcon, UserCheckIcon, UserXIcon, MessageSquareIcon, Eye, RotateCcw } from "lucide-react"

interface User {
    id: string
    name: string | null
    email: string | null
    image: string | null
    role: string
    createdAt?: Date | string | null
    firstName: string | null
    lastName: string | null
    phone: string | null
    birthDate: Date | null
    isActive?: boolean
    deletionReason?: string | null
}

export function CollaboratorsTable({ initialData }: { initialData: User[] }) {
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
    const [isReactivating, setIsReactivating] = useState<string | null>(null)

    const filteredData = useMemo(() => {
        return initialData.filter(user => {
            // Search filter
            const searchStr = `${user.name} ${user.email} ${user.firstName} ${user.lastName} ${user.phone}`.toLowerCase()
            if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) return false

            // Role filter
            if (roleFilter !== "ALL" && user.role !== roleFilter) return false

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
            "Rôle": user.role === 'RH' ? 'RH / Admin' : 'Salarié',
            "Statut": (user as any).isActive !== false ? 'Actif' : 'Inactif',
            "Motif Désactivation": (user as any).deletionReason || "-",
            "Date d'inscription": user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'
        }))
    }, [filteredData])

    const roleOptions = [
        { label: "Salariés", value: "SALARIE" },
        { label: "RH / Admin", value: "RH" }
    ]

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
                                    <p className={`font-bold text-sm truncate ${(user as any).isActive === false ? 'text-red-700' : 'text-foreground'}`}>
                                        {(user.firstName || user.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (user.name || "-")}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                                {user.role === 'RH' ? (
                                    <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200 text-[10px] font-bold shrink-0">RH</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-secondary bg-secondary/10 border-secondary/20 text-[10px] font-bold shrink-0 text-secondary-foreground">Salarié</Badge>
                                )}
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
                                        {user.role === 'RH' ? (
                                            <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">RH / Admin</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-secondary bg-secondary/10 border-secondary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">Salarié</Badge>
                                        )}
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
            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent className="max-w-[90vw] sm:max-w-sm border-border bg-background p-0 overflow-hidden">
                    <DialogHeader className="p-0">
                        <DialogTitle className="sr-only">Détails de {selectedUser?.firstName} {selectedUser?.lastName}</DialogTitle>
                    </DialogHeader>
                    <div className="p-5 bg-slate-900 text-white rounded-t-lg">
                        <div className="flex items-center gap-3">
                            {selectedUser?.image ? (
                                <img src={selectedUser.image} className="w-12 h-12 rounded-full object-cover border-2 border-white/20" alt="" />
                            ) : (
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 ${(selectedUser as any)?.isActive === false ? 'bg-red-100/20 text-red-300 border-red-300/30' : 'bg-white/10 text-white border-white/20'}`}>
                                    {selectedUser?.firstName?.charAt(0) || selectedUser?.email?.charAt(0) || '?'}
                                </div>
                            )}
                            <div>
                                <p className="font-black text-base">{selectedUser?.firstName} {selectedUser?.lastName}</p>
                                <p className="text-xs text-slate-400">{selectedUser?.email}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Rôle</span>
                            {selectedUser?.role === 'RH' ? (
                                <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200">RH / Admin</Badge>
                            ) : (
                                <Badge variant="outline" className="text-secondary bg-secondary/10 border-secondary/20">Salarié</Badge>
                            )}
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
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

