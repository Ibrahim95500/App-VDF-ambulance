"use client"

import { useState, useEffect } from "react"
import { getVehiclesWithAssignments, getAvailablePersonnel, getRegulationHistory } from "@/actions/regulation.actions"

import { AmbulanceCard } from "@/components/regulation/ambulance-card"
import { AssignmentDialog } from "@/components/regulation/assignment-dialog"
import { HistoryTable } from "@/components/regulation/history-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover"
import {
    Calendar as CalendarIcon,
    Ambulance,
    ChevronRight,
    Search,
    Loader2
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function RegulationView() {
    const [date, setDate] = useState<Date>(() => {
        const d = new Date()
        d.setDate(d.getDate() + 1) // Demain par défaut
        return d
    })

    const [vehicles, setVehicles] = useState<any[]>([])
    const [personnel, setPersonnel] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState<string>("ALL")
    const [currentTime, setCurrentTime] = useState(new Date())

    // History State
    const [viewMode, setViewMode] = useState<'PLANNING' | 'HISTORY'>('PLANNING')
    const [historyData, setHistoryData] = useState<any[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    // Dialog State
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [page, setPage] = useState(1)

    // Date flags
    const isTomorrow = new Date(date).setHours(0,0,0,0) === new Date(new Date().setDate(new Date().getDate() + 1)).setHours(0,0,0,0);
    const isToday = new Date(date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0);
    const isPast = new Date(date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Met à jour chaque minute
        return () => clearInterval(timer);
    }, []);

    // Pooling 2s pour le temps réel (Uniquement en mode PLANNING et pour Aujourd'hui/Demain)
    useEffect(() => {
        if (viewMode !== 'PLANNING') return;
        
        // On n'active le pooling intensif que pour les dates proches (Aujourd'hui ou Demain)
        const isNearDate = isToday || isTomorrow;
        if (!isNearDate) return;

        const interval = setInterval(() => {
            loadData(true);
        }, 2000);

        return () => clearInterval(interval);
    }, [viewMode, date, isToday, isTomorrow]);

    // History State (ALREADY MOVED UP)

    // Dialog State (ALREADY MOVED UP)

    useEffect(() => {
        setPage(1)
        loadData()
    }, [date])

    useEffect(() => {
        setPage(1)
    }, [searchTerm, activeTab])

    useEffect(() => {
        if (viewMode === 'HISTORY' && historyData.length === 0) {
            loadHistory()
        }
    }, [viewMode])

    const loadHistory = async () => {
        try {
            setLoadingHistory(true)
            const data = await getRegulationHistory()
            setHistoryData(data)
        } catch (error) {
            toast.error("Impossible de charger l'historique complet")
        } finally {
            setLoadingHistory(false)
        }
    }

    const loadData = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true)
            const dateStr = format(date, 'yyyy-MM-dd')
            const [vData, pData] = await Promise.all([
                getVehiclesWithAssignments(dateStr),
                getAvailablePersonnel(dateStr)
            ])
            setVehicles(vData)
            setPersonnel(pData)
        } catch (error) {
            console.error("Erreur chargement regulation:", error)
        } finally {
            if (!isSilent) setLoading(false)
        }
    }



    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch = v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesTab = activeTab === "ALL" || v.category === activeTab
        return matchesSearch && matchesTab
    })

    const counts = {
        ALL: vehicles.length,
        MARK: vehicles.filter(v => v.category === 'MARK').length,
        VDF: vehicles.filter(v => v.category === 'VDF').length,
    }

    const currentHour = currentTime.getHours();
    // isTomorrow, isToday, isPast (ALREADY MOVED UP)

    let totalPersons = 0;
    let validated = 0;
    vehicles.forEach(v => {
        if (v.assignments && v.assignments.length > 0) {
            const a = v.assignments[0];
            if (a.leaderId) { totalPersons++; if (a.leaderValidated) validated++; }
            if (a.teammateId) { totalPersons++; if (a.teammateValidated) validated++; }
        }
    });

    const getStatusDisplay = () => {
        if (isPast) return { label: "Terminé (Historique)", className: "bg-slate-200 text-slate-800 border-slate-300" };
        if (isToday) return { label: "En service (Jour J)", className: "bg-purple-100 text-purple-800 border-purple-300" };
        
        if (isTomorrow) {
            if (currentHour < 19) {
                const targetTime = new Date(currentTime);
                targetTime.setHours(19, 0, 0, 0);
                const diffMs = targetTime.getTime() - currentTime.getTime();
                const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                const timeStr = `${diffHrs}h ${diffMins}m`;

                return { label: `Planification en cours (${timeStr} restants)`, className: "bg-blue-100 text-blue-800 border-blue-300 animate-pulse" };
            } else if (currentHour >= 19 && currentHour < 21) {
                const totalVehicles = vehicles.filter(v => v.assignments?.length > 0).length;
                const validatedVehicles = vehicles.filter(v => v.assignments?.[0]?.status === 'VALIDATED').length;
                
                return { 
                    label: `En cours : Véhicules (${validatedVehicles}/${totalVehicles}) • Personnes (${validated} / ${totalPersons})`, 
                    className: "bg-orange-100 text-orange-800 border-orange-300 font-bold shadow-sm" 
                };
            } else {
                return { label: "Terminé : Préparez le planning du jour suivant", className: "bg-green-100 text-green-800 border-green-300 font-bold" };
            }
        }

        return { label: "Planification en avance", className: "bg-blue-50 text-blue-600 border-blue-200" };
    };

    const statusObj = getStatusDisplay();

    return (
        <div className="flex flex-col gap-6 p-6 pb-24">
            {/* Header / Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                        <div className="p-2.5 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-500/20">
                            <CalendarIcon size={24} />
                        </div>
                        Régulation du Plateau
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1 font-medium">
                        Planifiez les équipages pour le <span className="text-orange-600 font-bold">{format(date, 'EEEE d MMMM yyyy', { locale: fr })}</span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-12 px-4 gap-2 font-bold border-2">
                                <CalendarIcon size={18} className="text-orange-500" />
                                {format(date, 'd MMM yyyy', { locale: fr })}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => d && setDate(d)}
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

                    <div className={`px-4 py-2 rounded-xl border-2 ${statusObj.className} flex items-center gap-2 h-12`}>
                        <div className={`w-2 h-2 rounded-full ${statusObj.className.includes('blue') ? 'bg-blue-500' : statusObj.className.includes('orange') ? 'bg-orange-500' : statusObj.className.includes('green') ? 'bg-green-500' : statusObj.className.includes('purple') ? 'bg-purple-500' : 'bg-slate-500'}`}></div>
                        <span className="text-sm">{statusObj.label}</span>
                    </div>

                    {/* Bouton Actualiser Stylé */}
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => loadData()}
                        disabled={loading}
                        className="h-12 w-12 rounded-xl border-2 hover:bg-slate-50 hover:text-orange-500 hover:border-orange-200 transition-all duration-300 shadow-sm group"
                    >
                        <Loader2 className={cn(
                            "size-5 transition-transform duration-500 group-hover:rotate-180",
                            loading && "animate-spin"
                        )} />
                    </Button>
                </div>
            </div>

            {/* Main Navigation Tabs */}
            <div className="flex w-full md:w-auto bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border-2 border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setViewMode('PLANNING')}
                    className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-bold text-sm transition-all ${
                        viewMode === 'PLANNING' 
                            ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700' 
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    Planification du Jour
                </button>
                <button
                    onClick={() => setViewMode('HISTORY')}
                    className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-bold text-sm transition-all ${
                        viewMode === 'HISTORY' 
                            ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700' 
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    Historique Passé
                </button>
            </div>

            {viewMode === 'HISTORY' ? (
                loadingHistory ? (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p className="font-bold">Chargement de l'historique...</p>
                    </div>
                ) : (
                    <HistoryTable data={historyData} />
                )
            ) : (
                <>
                    {/* Filters Row (Planning Mode ONLY) */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                    <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-12 border">
                        <TabsTrigger value="ALL" className="rounded-lg px-6 font-bold">
                            Tous <Badge variant="secondary" className="ml-2 bg-slate-200 dark:bg-slate-700">{counts.ALL}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="MARK" className="rounded-lg px-6 font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                            MARK <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-600">{counts.MARK}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="VDF" className="rounded-lg px-6 font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                            VDF <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-600">{counts.VDF}</Badge>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                        placeholder="Rechercher une plaque (ex: EP-268...)"
                        className="pl-10 h-12 rounded-xl border-2 focus-visible:ring-orange-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid of Ambulances */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-[200px] bg-slate-100 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200"></div>
                    ))}
                </div>
            ) : filteredVehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200">
                    <Ambulance size={64} className="text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">Aucun véhicule trouvé</h3>
                    <p className="text-slate-400 text-sm">Réessayez avec une autre recherche ou une autre date.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in transition-all">
                        {filteredVehicles.slice((page - 1) * 10, page * 10).map(vehicle => {
                            const assignment = vehicle.assignments?.[0]
                            return (
                                <AmbulanceCard
                                    key={vehicle.id}
                                    plateNumber={vehicle.plateNumber}
                                    category={vehicle.category}
                                    leaderName={assignment?.leader ? `${assignment.leader.lastName} ${assignment.leader.firstName}` : undefined}
                                    teammateName={assignment?.teammate ? `${assignment.teammate.lastName} ${assignment.teammate.firstName}` : undefined}
                                    leaderDiploma={assignment?.leader?.diploma || undefined}
                                    teammateDiploma={assignment?.teammate?.diploma || undefined}
                                    leaderIsRegulateur={assignment?.leader?.isRegulateur || false}
                                    teammateIsRegulateur={assignment?.teammate?.isRegulateur || false}
                                    leaderValidated={assignment?.leaderValidated || false}
                                    teammateValidated={assignment?.teammateValidated || false}
                                    status={assignment?.status}
                                    startTime={assignment?.startTime}
                                    onClick={() => {
                                        setSelectedVehicle(vehicle)
                                        setIsDialogOpen(true)
                                    }}
                                />
                            )
                        })}
                    </div>

                    {/* Pagination UI */}
                    {filteredVehicles.length > 10 && (
                        <div className="flex items-center justify-center gap-4 mt-8 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="h-10 px-4 font-bold rounded-xl"
                            >
                                Précédent
                            </Button>
                            <span className="text-sm font-black">
                                Page <span className="text-orange-600">{page}</span> sur {Math.ceil(filteredVehicles.length / 10)}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => Math.min(Math.ceil(filteredVehicles.length / 10), p + 1))}
                                disabled={page === Math.ceil(filteredVehicles.length / 10)}
                                className="h-10 px-4 font-bold rounded-xl"
                            >
                                Suivant
                            </Button>
                        </div>
                    )}
                </>
            )}
            </>
            )}

            {/* Assignment Dialog */}
            {selectedVehicle && (
                <AssignmentDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    vehicleId={selectedVehicle.id}
                    plateNumber={selectedVehicle.plateNumber}
                    category={selectedVehicle.category}
                    date={date}
                    dateStr={format(date, 'yyyy-MM-dd')}
                    personnel={personnel}
                    vehicles={vehicles}
                    onSuccess={() => loadData()}
                    initialData={selectedVehicle.assignments?.[0] ? {
                        leaderId: selectedVehicle.assignments[0].leaderId,
                        teammateId: selectedVehicle.assignments[0].teammateId,
                        startTime: selectedVehicle.assignments[0].startTime,
                        endTime: selectedVehicle.assignments[0].endTime
                    } : undefined}
                />
            )}
        </div>
    )
}
