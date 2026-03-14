"use client"

import { useState } from "react"
import { format, isBefore, setHours, setMinutes, setSeconds, setMilliseconds, subDays } from "date-fns"
import { fr } from "date-fns/locale"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, Calendar as CalendarIcon, User, Ambulance } from "lucide-react"
import { HistoryDetailsDialog } from "./history-details-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

interface HistoryTableProps {
    data: any[]
}

export function HistoryTable({ data }: HistoryTableProps) {
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [page, setPage] = useState(1)
    const itemsPerPage = 10

    // Filtrage
    const filteredData = data.filter(item => {
        const searchStr = searchTerm.toLowerCase()
        const plate = item.vehicle?.plateNumber?.toLowerCase() || ""
        const leader = `${item.leader?.lastName} ${item.leader?.firstName}`.toLowerCase()
        const teammate = `${item.teammate?.lastName} ${item.teammate?.firstName}`.toLowerCase()
        const itemDateStr = format(new Date(item.date), 'dd/MM/yyyy')

        const matchesSearch = plate.includes(searchStr) || 
                              leader.includes(searchStr) || 
                              teammate.includes(searchStr) || 
                              itemDateStr.includes(searchStr)

        const matchesDate = selectedDate 
            ? format(new Date(item.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
            : true

        return matchesSearch && matchesDate
    })

    const handleViewDetails = (assignment: any) => {
        setSelectedAssignment(assignment)
        setIsDialogOpen(true)
    }

    const handleExportCSV = () => {
        const headers = ["Date", "Vehicule", "Categorie", "Responsable", "Co-equipier", "Horaires", "Statut", "Valide le (Leader)", "Valide le (Equipier)"];
        const rows = filteredData.map(item => [
            format(new Date(item.date), 'dd/MM/yyyy'),
            item.vehicle?.plateNumber || "",
            item.vehicle?.category || "",
            `${item.leader?.lastName} ${item.leader?.firstName}`,
            `${item.teammate?.lastName} ${item.teammate?.firstName}`,
            item.startTime || "",
            item.status,
            item.leaderValidatedAt ? format(new Date(item.leaderValidatedAt), 'dd/MM HH:mm') : "N/A",
            item.teammateValidatedAt ? format(new Date(item.teammateValidatedAt), 'dd/MM HH:mm') : "N/A"
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `historique_regulation_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const getStatusBadge = (status: string, dateStr: string) => {
        if (status === 'VALIDATED') {
            return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Validé</Badge>
        }
        if (status === 'REJECTED') {
            return <Badge variant="destructive">Refusé</Badge>
        }
        
        if (status === 'PENDING') {
            const now = new Date();
            const assignmentDate = new Date(dateStr);
            const dDay = subDays(assignmentDate, 1);
            
            const threshold19h = setMilliseconds(setSeconds(setMinutes(setHours(dDay, 19), 0), 0), 0);
            const threshold21h = setMilliseconds(setSeconds(setMinutes(setHours(dDay, 21), 0), 0), 0);

            if (isBefore(now, threshold19h)) {
                return <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50 font-bold shadow-sm">En Planification</Badge>;
            } else if (now >= threshold19h && isBefore(now, threshold21h)) {
                return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 font-bold shadow-sm animate-pulse">En attente (21h)</Badge>;
            } else {
                return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 font-bold shadow-sm">Oubli (Non validé)</Badge>;
            }
        }
        return <Badge variant="secondary">{status}</Badge>;
    }

    return (
        <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder="Rechercher (plaque, nom...)"
                            className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 focus-visible:ring-orange-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={`h-11 px-4 gap-2 font-bold border-2 rounded-xl bg-white dark:bg-slate-900 w-full md:w-auto ${selectedDate ? 'border-orange-500 text-orange-600' : 'border-slate-200 text-slate-500'}`}>
                                <CalendarIcon size={18} />
                                {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : "Filtrer par date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                initialFocus
                                locale={fr}
                                modifiers={{
                                    tomorrow: (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(0,0,0,0); return d; })()
                                }}
                                modifiersClassNames={{
                                    tomorrow: 'rdp-tomorrow'
                                }}
                                classNames={{
                                    today: '*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[5px] *:after:-translate-x-1/2 rtl:*:after:translate-x-1/2 *:after:rounded-full *:after:bg-purple-500 [&[data-selected]:not(.range-middle)>*]:after:bg-background [&[data-disabled]>*]:after:bg-foreground/30 *:after:transition-colors text-purple-600 dark:text-purple-400 font-black'
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                    
                    {selectedDate && (
                        <Button variant="ghost" className="text-slate-500 hover:text-slate-700 font-bold h-11 px-3 w-full md:w-auto" onClick={() => setSelectedDate(undefined)}>
                            Effacer la date
                        </Button>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleExportCSV}
                        className="h-11 px-4 gap-2 font-bold border-2 rounded-xl bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-all shadow-sm"
                    >
                        Exporter CSV
                    </Button>
                    <div className="text-sm text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg whitespace-nowrap">
                        {filteredData.length} résultat(s)
                    </div>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800">
                        <TableRow>
                            <TableHead className="py-4">Date</TableHead>
                            <TableHead>Véhicule</TableHead>
                            <TableHead>Responsable</TableHead>
                            <TableHead>Co-équipier</TableHead>
                            <TableHead>Horaires</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-slate-500 font-medium">
                                    Aucun historique trouvé.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((item) => (
                                <TableRow key={item.id} className="cursor-pointer hover:bg-slate-50/50" onClick={() => handleViewDetails(item)}>
                                    <TableCell className="font-bold whitespace-nowrap">
                                        {format(new Date(item.date), 'dd/MM/yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-bold whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] text-white ${item.vehicle?.category === 'MARK' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                                                {item.vehicle?.category || 'N/A'}
                                            </span>
                                            {item.vehicle?.plateNumber}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium truncate max-w-[150px]">{item.leader?.lastName} {item.leader?.firstName}</div>
                                        {item.leaderValidatedAt && (
                                            <div className="text-[10px] text-green-600 font-bold">Validé à {format(new Date(item.leaderValidatedAt), 'HH:mm')}</div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-600 truncate max-w-[150px]">{item.teammate?.lastName} {item.teammate?.firstName}</div>
                                        {item.teammateValidatedAt && (
                                            <div className="text-[10px] text-green-600 font-bold">Validé à {format(new Date(item.teammateValidatedAt), 'HH:mm')}</div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap">
                                            {item.startTime}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(item.status, item.date)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewDetails(item); }}>
                                            <Eye size={18} className="text-slate-500 hover:text-orange-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Desktop */}
            {totalPages > 1 && (
                <div className="hidden md:flex items-center justify-center gap-4 mt-2">
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-10 px-4 font-bold rounded-xl"
                    >
                        Précédent
                    </Button>
                    <span className="text-sm font-black">
                        Page <span className="text-orange-600">{page}</span> sur {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="h-10 px-4 font-bold rounded-xl"
                    >
                        Suivant
                    </Button>
                </div>
            )}

            {/* Mobile View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {paginatedData.length === 0 ? (
                    <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                        Aucun historique trouvé.
                    </div>
                ) : (
                    paginatedData.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-3 cursor-pointer" onClick={() => handleViewDetails(item)}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg text-white ${item.vehicle?.category === 'MARK' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                                        <Ambulance size={16} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm tracking-tight">{item.vehicle?.plateNumber}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                                            <CalendarIcon size={12} />
                                            {format(new Date(item.date), 'dd/MM/yyyy')}
                                        </div>
                                    </div>
                                </div>
                                {getStatusBadge(item.status, item.date)}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100">
                                <div className="overflow-hidden">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><User size={10} /> Chef de bord</div>
                                    <div className="font-bold truncate">{item.leader?.lastName} {item.leader?.firstName}</div>
                                    {item.leaderValidatedAt && (
                                        <div className="text-[9px] text-green-600 font-bold px-1 py-0.5 bg-green-50 rounded mt-1">OK à {format(new Date(item.leaderValidatedAt), 'HH:mm')}</div>
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><User size={10} /> Équipier</div>
                                    <div className="font-bold truncate">{item.teammate?.lastName} {item.teammate?.firstName}</div>
                                    {item.teammateValidatedAt && (
                                        <div className="text-[9px] text-green-600 font-bold px-1 py-0.5 bg-green-50 rounded mt-1">OK à {format(new Date(item.teammateValidatedAt), 'HH:mm')}</div>
                                    )}
                                </div>
                            </div>
                            
                            <Button 
                                variant="secondary" 
                                className="w-full h-10 font-bold bg-slate-100/80"
                                onClick={(e) => { e.stopPropagation(); handleViewDetails(item); }}
                            >
                                <Eye size={16} className="mr-2" />
                                Voir les détails
                            </Button>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Mobile */}
            {totalPages > 1 && (
                <div className="flex md:hidden items-center justify-center gap-4 mt-2 bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-200">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="font-bold"
                    >
                        Prc.
                    </Button>
                    <span className="text-xs font-black">
                        {page} / {totalPages}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="font-bold"
                    >
                        Suiv.
                    </Button>
                </div>
            )}

            {selectedAssignment && (
                <HistoryDetailsDialog 
                    isOpen={isDialogOpen} 
                    onOpenChange={setIsDialogOpen} 
                    assignment={selectedAssignment} 
                />
            )}
        </div>
    )
}
