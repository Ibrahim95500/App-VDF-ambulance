"use client"

import { useState, useMemo } from "react"
import { MyServiceRequest } from "@/services/my-requests"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MessageSquare, Eye } from "lucide-react"
import { TablePagination } from "@/components/common/table-pagination"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

export function ServiceHistoryTable({ initialData }: { initialData: MyServiceRequest[] }) {
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedReq, setSelectedReq] = useState<MyServiceRequest | null>(null)
    const PAGE_SIZE = 10

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return initialData.slice(start, start + PAGE_SIZE)
    }, [initialData, currentPage])

    const getStatusBadge = (status: string) => {
        if (status === 'APPROVED') return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Approuvée</Badge>
        if (status === 'REJECTED') return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Refusée</Badge>
        return <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">En attente</Badge>
    }

    if (initialData.length === 0) {
        return (
            <div className="flex flex-col rounded-xl border border-secondary/50 border-t-4 border-t-secondary items-center justify-center p-12 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mb-4 opacity-20" />
                <p>Vous n'avez pas encore de demandes de service.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col rounded-xl border border-secondary/50 border-t-4 border-t-secondary overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/5">
                <h2 className="text-base font-semibold text-secondary tracking-wide">HISTORIQUE DE MES DEMANDES</h2>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-border px-4">
                {paginatedData.map((req) => (
                    <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-1 min-w-0">
                            <p className="font-bold text-foreground text-sm truncate">{req.subject}</p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="text-[10px] font-bold py-0">{req.category}</Badge>
                                <span className="flex items-center gap-1">
                                    <Calendar className="size-3" />{new Date(req.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                            </div>
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
                    <thead className="text-xs uppercase bg-muted/20 text-muted-foreground border-b border-border">
                        <tr>
                            <th className="px-5 py-3 font-semibold">Catégorie</th>
                            <th className="px-5 py-3 font-semibold">Sujet</th>
                            <th className="px-5 py-3 font-semibold text-center">Date</th>
                            <th className="px-5 py-3 font-semibold text-right">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {paginatedData.map((req) => (
                            <tr key={req.id} className="hover:bg-muted/10 transition-colors">
                                <td className="px-5 py-4">
                                    <Badge variant="secondary" className="font-medium">{req.category}</Badge>
                                </td>
                                <td className="px-5 py-4 max-w-[200px] truncate font-medium text-foreground">{req.subject}</td>
                                <td className="px-5 py-4 text-center text-muted-foreground text-sm">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <Calendar className="size-3" />
                                        {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-right">{getStatusBadge(req.status)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <TablePagination
                currentPage={currentPage}
                totalItems={initialData.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
            />

            {/* Detail dialog */}
            <Dialog open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
                <DialogContent className="max-w-[90vw] sm:max-w-sm border-border bg-background p-0 overflow-hidden">
                    <DialogHeader className="p-5 bg-slate-900 text-white">
                        <div className="text-slate-400 text-[10px] mb-1 uppercase tracking-widest font-bold">
                            {selectedReq?.category}
                        </div>
                        <DialogTitle className="text-lg font-black italic text-white">{selectedReq?.subject}</DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs">
                            {selectedReq ? new Date(selectedReq.createdAt).toLocaleDateString('fr-FR') : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Statut</span>
                            {selectedReq && getStatusBadge(selectedReq.status)}
                        </div>
                        {selectedReq?.description && (
                            <div className="space-y-1">
                                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Description</span>
                                <p className="text-sm text-foreground p-3 bg-muted/30 rounded-lg border border-border italic">
                                    {selectedReq.description}
                                </p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
