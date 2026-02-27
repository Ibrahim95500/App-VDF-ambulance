"use client"

import { useState } from "react"
import { GlobalServiceRequest } from "@/services/service-request"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    CheckCircle2,
    XCircle,
    Eye,
    Mail,
    Smartphone,
    Layout,
    Clock,
    User as UserIcon,
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

export function RHServiceRequestsTable({ initialData }: { initialData: GlobalServiceRequest[] }) {
    const [data, setData] = useState(initialData)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<GlobalServiceRequest | null>(null)

    const handleUpdateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
        try {
            setLoadingId(id)
            await updateServiceRequestStatus(id, status)
            setData((prev: GlobalServiceRequest[]) => prev.map(req => req.id === id ? { ...req, status } : req))
            toast.success(`Demande ${status === 'APPROVED' ? 'approuvée' : 'refusée'} avec succès`)
            if (selectedRequest?.id === id) {
                setSelectedRequest((prev: GlobalServiceRequest | null) => prev ? { ...prev, status } : null)
            }
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue")
        } finally {
            setLoadingId(null)
        }
    }

    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'WHATSAPP': return <Smartphone className="size-3.5 text-green-600" />
            case 'EMAIL': return <Mail className="size-3.5 text-blue-500" />
            default: return <Layout className="size-3.5 text-gray-400" />
        }
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-4 opacity-20" />
                <p>Aucune demande de service à traiter pour le moment.</p>
            </div>
        )
    }

    return (
        <div className="overflow-hidden bg-white">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 border-y border-slate-200">
                        <TableHead className="font-bold text-slate-700">Collaborateur</TableHead>
                        <TableHead className="font-bold text-slate-700">Catégorie</TableHead>
                        <TableHead className="font-bold text-slate-700">Sujet</TableHead>
                        <TableHead className="font-bold text-slate-700 text-center">Source</TableHead>
                        <TableHead className="font-bold text-slate-700 text-center">Date</TableHead>
                        <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((req) => (
                        <TableRow key={req.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                            <TableCell className="font-semibold py-4">
                                <div className="flex items-center gap-2">
                                    <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs">
                                        {(req.user.firstName?.[0] || 'U')}{(req.user.lastName?.[0] || '')}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">{req.user.firstName} {req.user.lastName}</div>
                                        <div className="text-[10px] text-slate-400 font-normal">{req.user.email}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="font-medium bg-slate-100 text-slate-600 border-none px-2.5 py-0.5 uppercase text-[10px]">
                                    {req.category}
                                </Badge>
                            </TableCell>
                            <TableCell className="max-w-[180px] font-medium text-slate-700">
                                <div className="truncate">{req.subject}</div>
                            </TableCell>
                            <TableCell>
                                <div className="flex justify-center">
                                    <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-0 border-slate-200 bg-white shadow-xs">
                                        {getSourceIcon(req.source)}
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{req.source}</span>
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell className="text-center text-slate-500 text-xs">
                                <div className="flex flex-col items-center">
                                    <div className="font-semibold">{new Date(req.createdAt).toLocaleDateString('fr-FR')}</div>
                                    <div className="text-[10px] opacity-60 flex items-center gap-1"><Clock className="size-2" /> {new Date(req.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right py-4">
                                {req.status === 'PENDING' ? (
                                    <div className="flex justify-end items-center gap-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setSelectedRequest(req)}>
                                                    <Eye className="size-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden p-0">
                                                <DialogHeader className="p-6 bg-slate-900 text-white">
                                                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-2 uppercase tracking-widest font-bold">
                                                        <Layout className="size-3" /> Demande de Service • {req.category}
                                                    </div>
                                                    <DialogTitle className="text-2xl font-black">{req.subject}</DialogTitle>
                                                    <DialogDescription className="text-slate-400">
                                                        Postée le {new Date(req.createdAt).toLocaleDateString('fr-FR')} par {req.user.firstName} {req.user.lastName}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="p-8 space-y-6 bg-white">
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                            <AlertCircle className="size-3" /> Description de la demande
                                                        </h4>
                                                        <div className="p-5 bg-slate-50 rounded-xl text-slate-700 text-lg leading-relaxed border border-slate-100 italic">
                                                            {req.description}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                                                        <Button
                                                            variant="outline"
                                                            className="flex-1 h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
                                                            disabled={loadingId === req.id}
                                                            onClick={() => handleUpdateStatus(req.id, "REJECTED")}
                                                        >
                                                            <XCircle className="mr-2 size-5" /> Refuser
                                                        </Button>
                                                        <Button
                                                            className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200"
                                                            disabled={loadingId === req.id}
                                                            onClick={() => handleUpdateStatus(req.id, "APPROVED")}
                                                        >
                                                            <CheckCircle2 className="mr-2 size-5" /> Approuver
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

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
                                    </div>
                                ) : (
                                    <Badge variant="outline" className={`
                                        font-bold px-3 py-1 border-none shadow-xs
                                        ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                                    `}>
                                        {req.status === 'APPROVED' ? 'APPROUVÉE' : 'REFUSÉE'}
                                    </Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
