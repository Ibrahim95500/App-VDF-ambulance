"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, MapPin, Navigation, Calendar, ScanEye, Trash2, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TableActions } from "@/components/common/table-actions"
import { TablePagination } from "@/components/common/table-pagination"
import { isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { DateRange } from "react-day-picker"
import { deleteSniperLog } from "@/actions/sniper-logs.actions"
import { toast } from "sonner"

export function SniperLogClient({ data: initialData }: { data: any[] }) {
    const [data, setData] = useState(initialData)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [currentPage, setCurrentPage] = useState(1)
    const PAGE_SIZE = 10

    useEffect(() => { setCurrentPage(1) }, [searchTerm, statusFilter, dateRange])
    useEffect(() => { setData(initialData) }, [initialData])

    const router = useRouter()
    
    // Auto-refresh en temps réel (toutes les 15 secondes)
    useEffect(() => {
        const intervalId = setInterval(() => {
            router.refresh()
        }, 15000)
        return () => clearInterval(intervalId)
    }, [router])

    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        if(e) e.preventDefault()
        if(!window.confirm("BAM ! Tu veux vraiment envoyer cette course à la poubelle ? 🗑️")) return
        
        setIsDeleting(id)
        try {
            const res = await deleteSniperLog(id)
            if(res.success) {
                toast.success("Trophée supprimé avec succès ! 💥")
                setData(prev => prev.filter(req => req.id !== id))
            } else {
                toast.error("Erreur, cette cible résiste.")
            }
        } catch(err) {
            toast.error("Erreur système.")
        } finally {
            setIsDeleting(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "SUCCESS": return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Succès Auto</Badge>;
            case "MANUAL_SUCCESS": return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">Succès Manuel</Badge>;
            case "FAILED_ALREADY_TAKEN": return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Échec (Pris)</Badge>;
            case "MANUAL_PENDING": return <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">Attente</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    }

    const filteredData = useMemo(() => {
        return data.filter(req => {
            const searchStr = `${req.num || ''} ${req.demandeur || ''} ${req.patient || ''} ${req.depart} ${req.arrivee}`.toLowerCase()
            if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) return false

            if (statusFilter !== "ALL" && req.status !== statusFilter) return false

            if (dateRange?.from) {
                const reqDate = new Date(req.createdAt)
                const start = startOfDay(dateRange.from)
                const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)
                if (!isWithinInterval(reqDate, { start, end })) return false
            }

            return true
        })
    }, [data, searchTerm, statusFilter, dateRange])

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return filteredData.slice(start, start + PAGE_SIZE)
    }, [filteredData, currentPage])

    const exportData = useMemo(() => {
        return filteredData.map(req => ({
            "N°": req.num || "-",
            "Date RDV": req.datePec || "-",
            "Heure": req.heurePec || "-",
            "Demandeur": req.demandeur || "-",
            "Patient": req.patient || "-",
            "Départ": req.depart,
            "Arrivée": req.arrivee,
            "Choix": req.patientChoice === true ? "Oui (Choix VDF)" : req.patientChoice === false ? "Non (Aléatoire)" : "Inconnu",
            "Statut": req.status,
            "Date du Sniping": new Date(req.createdAt).toLocaleString('fr-FR')
        }))
    }, [filteredData])

    const statusOptions = [
        { label: "Succès Auto (VIP)", value: "SUCCESS" },
        { label: "Succès Manuel", value: "MANUAL_SUCCESS" },
        { label: "Échec (Déjà pris)", value: "FAILED_ALREADY_TAKEN" },
        { label: "Mise en attente", value: "MANUAL_PENDING" }
    ]

    const filterCounts = useMemo(() => {
        const counts: Record<string, number> = { ALL: data.length, SUCCESS: 0, MANUAL_SUCCESS: 0, FAILED_ALREADY_TAKEN: 0, MANUAL_PENDING: 0 }
        data.forEach(req => {
            if (req.status === 'SUCCESS') counts.SUCCESS++
            else if (req.status === 'MANUAL_SUCCESS') counts.MANUAL_SUCCESS++
            else if (req.status === 'FAILED_ALREADY_TAKEN') counts.FAILED_ALREADY_TAKEN++
            else if (req.status === 'MANUAL_PENDING') counts.MANUAL_PENDING++
        })
        return counts
    }, [data])

    return (
        <div className="flex flex-col gap-6">
            {/* Custom Tab Buttons like Collaborators Table */}
            <div className="flex flex-wrap items-center gap-4">
                <button 
                    onClick={() => setStatusFilter("ALL")}
                    className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${statusFilter === "ALL" ? "bg-slate-100 text-slate-800 border-slate-300 shadow-sm" : "bg-background text-muted-foreground border-border hover:bg-muted opacity-80"}`}
                >
                    <span className="font-black">{filterCounts.ALL}</span> Historique Complet
                </button>
                <button 
                    onClick={() => setStatusFilter("SUCCESS")}
                    className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${statusFilter === "SUCCESS" ? "bg-green-50 text-green-700 border-green-200 shadow-sm" : "bg-background text-muted-foreground border-border hover:bg-muted"}`}
                >
                    <span className="font-black text-green-800">{filterCounts.SUCCESS}</span> Succès Auto VIP
                </button>
                <button 
                    onClick={() => setStatusFilter("MANUAL_SUCCESS")}
                    className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${statusFilter === "MANUAL_SUCCESS" ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm" : "bg-background text-muted-foreground border-border hover:bg-muted"}`}
                >
                    <span className="font-black text-blue-800">{filterCounts.MANUAL_SUCCESS}</span> Succès Manuels
                </button>
                <button 
                    onClick={() => setStatusFilter("FAILED_ALREADY_TAKEN")}
                    className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${statusFilter === "FAILED_ALREADY_TAKEN" ? "bg-red-50 text-red-700 border-red-200 shadow-sm" : "bg-background text-muted-foreground border-border hover:bg-muted"}`}
                >
                    <span className="font-black text-red-800">{filterCounts.FAILED_ALREADY_TAKEN}</span> Coupures (Déjà Pris)
                </button>
            </div>

            <div className="border border-border rounded-xl p-6 bg-card">
                <TableActions
                    data={exportData}
                    onSearch={setSearchTerm}
                    onDateRangeChange={setDateRange}
                    filename="historique_amc_prt"
                    pdfTitle="Historique des validations AMC/PRT"
                />
            </div>

            {/* Mobile card view */}
            <div className="md:hidden border border-border rounded-xl overflow-hidden divide-y divide-border bg-card">
                {filteredData.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground italic">
                        Aucun historique trouvé.
                    </div>
                ) : paginatedData.map((log) => (
                    <div key={log.id} className="p-4 flex gap-3 flex-col hover:bg-muted/5 transition-colors">
                        <div className="flex justify-between items-start w-full">
                            <div>
                                <h3 className="font-bold text-lg text-foreground flex items-center gap-1">#{log.num || "INCONNU"}</h3>
                                <div className="flex items-center gap-2 mt-1 mb-1">
                                    <p className="text-xs text-muted-foreground w-fit">Patient : <span className="font-semibold">{log.patient || "-"}</span></p>
                                    {log.patientChoice === true && <span className="text-[9px] font-extrabold text-green-700 bg-green-100 uppercase px-1.5 py-0.5 rounded-sm">⭐ CHOIX VDF</span>}
                                    {log.patientChoice === false && <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100/80 uppercase px-1.5 py-0.5 rounded-sm">🎲 ALÉATOIRE</span>}
                                </div>
                            </div>
                            {getStatusBadge(log.status)}
                        </div>
                        <div className="flex gap-2 items-center text-xs mt-2 border border-border bg-muted/20 p-2 rounded-md">
                            <Calendar className="size-4 text-primary" /> 
                            <span className="font-semibold">{log.datePec || "-"}</span> à <span className="font-semibold">{log.heurePec || "-"}</span>
                        </div>
                        <div className="space-y-2 mt-2 ml-1">
                             <div className="flex gap-2 items-start text-sm pr-2">
                                <div className="mt-0.5 min-w-[20px]"><MapPin className="size-4 text-green-500" /></div>
                                <span className="text-muted-foreground line-clamp-2" title={log.depart}>{log.depart}</span>
                            </div>
                            <div className="border-l-2 border-dashed border-border ml-[9px] h-3"></div>
                            <div className="flex gap-2 items-start text-sm pr-2">
                                <div className="mt-0.5 min-w-[20px]"><Navigation className="size-4 text-blue-500" /></div>
                                <span className="text-foreground font-medium line-clamp-2" title={log.arrivee}>{log.arrivee}</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border">
                            {log.imageUrl ? (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="flex items-center gap-2 text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
                                            <ScanEye className="size-4" /> Capture
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-[95vw] sm:max-w-4xl p-2 bg-black border-none">
                                        <DialogHeader className="sr-only"><DialogTitle>Capture</DialogTitle></DialogHeader>
                                        <div className="flex justify-center bg-black">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={log.imageUrl} alt="Preuve" className="max-h-[85vh] object-contain rounded-md" />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            ) : (
                                <button disabled className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full cursor-not-allowed">
                                    <ScanEye className="size-4 opacity-50" /> P.D.C
                                </button>
                            )}
                            <button 
                                onClick={(e) => handleDelete(log.id, e)}
                                disabled={isDeleting === log.id}
                                className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                                {isDeleting === log.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto border border-border rounded-xl w-full bg-card">
                <table className="w-full text-sm text-left align-middle text-muted-foreground border-collapse min-w-[1000px]">
                    <thead className="text-[10px] text-muted-foreground uppercase border-b border-border bg-muted/30 tracking-wider">
                        <tr>
                            <th scope="col" className="px-4 py-3 font-semibold">Référence</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Date RDV</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Patient & Demandeur</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Trajet (Départ ➔ Arrivée)</th>
                            <th scope="col" className="px-4 py-3 font-semibold text-center">Choix Patient</th>
                            <th scope="col" className="px-4 py-3 font-semibold text-center">Statut</th>
                            <th scope="col" className="px-4 py-3 font-semibold text-right w-24">Aperçu</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground italic">
                                    Aucun historique trouvé pour ces critères.
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((log) => (
                                <tr key={log.id} className="hover:bg-muted/10 transition-colors group">
                                    <td className="px-4 py-3 align-top">
                                        <div className="font-bold text-foreground">#{log.num || "-"}</div>
                                        <div className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">Snip: {new Date(log.createdAt).toLocaleTimeString('fr-FR')}</div>
                                    </td>
                                    <td className="px-4 py-3 align-top whitespace-nowrap">
                                        <div className="font-medium bg-muted/40 inline-flex px-2 py-0.5 rounded border border-border text-xs mb-1">{log.datePec || "-"}</div>
                                        <div className="flex items-center gap-1 text-[10px]"><Calendar className="size-3" /> à {log.heurePec || "-"}</div>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="font-semibold text-foreground max-w-[150px] truncate" title={log.patient}>{log.patient || "-"}</div>
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground max-w-[150px] truncate mt-1" title={log.demandeur}>{log.demandeur || "-"}</div>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="space-y-1.5 w-full max-w-[280px]">
                                             <div className="flex gap-2 items-center text-xs">
                                                <MapPin className="size-3.5 text-green-500 shrink-0" />
                                                <span className="text-muted-foreground truncate" title={log.depart}>{log.depart}</span>
                                            </div>
                                            <div className="flex gap-2 items-center text-xs">
                                                <Navigation className="size-3.5 text-blue-500 shrink-0" />
                                                <span className="text-foreground font-medium truncate" title={log.arrivee}>{log.arrivee}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 align-middle text-center">
                                        {log.patientChoice === true ? (
                                            <div className="text-[10px] font-extrabold text-green-700 bg-green-100 uppercase px-2 py-1 rounded-sm inline-block shadow-sm ring-1 ring-green-600/20">⭐ CHOIX VDF</div>
                                        ) : log.patientChoice === false ? (
                                            <div className="text-[10px] font-extrabold text-amber-700 bg-amber-100/80 uppercase px-2 py-1 rounded-sm inline-block shadow-sm ring-1 ring-amber-600/20">🎲 ALÉATOIRE</div>
                                        ) : (
                                            <span className="text-muted-foreground text-[10px] italic">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 align-middle text-center">
                                        {getStatusBadge(log.status)}
                                    </td>
                                    <td className="px-4 py-3 align-middle text-right">
                                        <div className="flex justify-end items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                            {log.imageUrl ? (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="size-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50" title="Voir la Capture Photo">
                                                            <ScanEye className="size-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-4xl p-2 bg-black border-none">
                                                        <DialogHeader className="sr-only"><DialogTitle>Capture de la course AMC</DialogTitle></DialogHeader>
                                                        <div className="flex justify-center bg-black">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={log.imageUrl} alt="Preuve" className="max-h-[85vh] object-contain rounded-md" />
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            ) : (
                                                <Button variant="ghost" size="icon" disabled className="size-8 text-slate-300" title="Pas de capture enregistrée">
                                                    <ScanEye className="size-4" />
                                                </Button>
                                            )}
                                            {!log.num && !log.imageUrl && (
                                                <span className="text-muted-foreground text-[10px] italic mr-1 ml-1">-</span>
                                            )}
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={(e) => handleDelete(log.id, e)}
                                                disabled={isDeleting === log.id}
                                                className="size-8 text-red-500 hover:text-red-700 hover:bg-red-50 ml-1"
                                                title="Supprimer"
                                            >
                                                {isDeleting === log.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4">
                <TablePagination
                    currentPage={currentPage}
                    totalItems={filteredData.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    )
}
