"use client"

import { useState, useEffect } from "react"
import { getVehiclesWithAssignments, getAvailablePersonnel, getRegulationHistory, getRegulationAssignments, getDisponibilities, deletePlanningAssignment } from "@/actions/regulation.actions"

import { AmbulanceCard } from "@/components/regulation/ambulance-card"
import { AssignmentDialog } from "@/components/regulation/assignment-dialog"
import { RegulationTab } from "@/components/regulation/regulation-tab"
import { DispoTab } from "@/components/regulation/dispo-tab"
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

    const [personnel, setPersonnel] = useState<any[]>([])
    const [vehiclesJour, setVehiclesJour] = useState<any[]>([])
    const [vehiclesNuit, setVehiclesNuit] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState<string>("ALL")
    const [currentTime, setCurrentTime] = useState(new Date())

    // History & New Tabs State
    const [viewMode, setViewMode] = useState<'PLANNING_JOUR' | 'PLANNING_NUIT' | 'REGULATION' | 'DISPO' | 'HISTORY'>('PLANNING_JOUR')
    const [historyData, setHistoryData] = useState<any[]>([])
    const [regulationData, setRegulationData] = useState<any[]>([])
    const [dispoData, setDispoData] = useState<any[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    // Dialog State
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Date flags
    const isTomorrow = new Date(date).setHours(0,0,0,0) === new Date(new Date().setDate(new Date().getDate() + 1)).setHours(0,0,0,0);
    const isToday = new Date(date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0);
    const isPast = new Date(date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Met à jour chaque minute
        return () => clearInterval(timer);
    }, []);

    // Pooling 2s pour le temps réel
    useEffect(() => {
        if (!viewMode.startsWith('PLANNING')) return;
        
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
        loadData()
    }, [date])

    useEffect(() => {
        if (viewMode === 'HISTORY') {
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
            const [vDataJour, vDataNuit, pData, rData, dData] = await Promise.all([
                getVehiclesWithAssignments(dateStr, 'JOUR'),
                getVehiclesWithAssignments(dateStr, 'NUIT'),
                getAvailablePersonnel(dateStr),
                getRegulationAssignments(dateStr),
                getDisponibilities(dateStr)
            ])
            setVehiclesJour(vDataJour)
            setVehiclesNuit(vDataNuit)
            setPersonnel(pData)
            setRegulationData(rData)
            setDispoData(dData)
        } catch (error) {
            console.error("Erreur chargement regulation:", error)
        } finally {
            if (!isSilent) setLoading(false)
        }
    }

    const activeVehicles = viewMode === 'PLANNING_NUIT' ? vehiclesNuit : vehiclesJour;

    const filteredVehicles = activeVehicles.filter(v => {
        if (activeTab !== "ALL" && v.category !== activeTab) return false
        if (searchTerm && !v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false
        return true
    }).sort((a, b) => {
        const getRank = (category: string, plate: string) => {
            const p = plate.toUpperCase();
            if (p.includes('VSL')) return 3;
            if (category === 'MARK') return 1;
            if (category === 'VDF') return 2;
            return 4;
        };
        const rankA = getRank(a.category, a.plateNumber);
        const rankB = getRank(b.category, b.plateNumber);
        if (rankA !== rankB) return rankA - rankB;
        return a.plateNumber.localeCompare(b.plateNumber);
    });

    const globalAssignedIds = new Set<string>();
    [...vehiclesJour, ...vehiclesNuit].forEach(v => {
        if (v.assignments && v.assignments.length > 0) {
            v.assignments.forEach((a: any) => {
                if (a.leaderId) globalAssignedIds.add(a.leaderId);
                if (a.teammateId) globalAssignedIds.add(a.teammateId);
            });
        }
    });
    regulationData.forEach(r => globalAssignedIds.add(r.userId));
    dispoData.filter(d => d.status !== 'INTEGRATED').forEach(d => globalAssignedIds.add(d.userId));

    const counts = {
        ALL: activeVehicles.length,
        MARK: activeVehicles.filter(v => v.category === 'MARK').length,
        VDF: activeVehicles.filter(v => v.category === 'VDF').length,
    }

    const currentHour = currentTime.getHours();
    // isTomorrow, isToday, isPast (ALREADY MOVED UP)

    let totalPersons = 0;
    let validated = 0;
    activeVehicles.forEach(v => {
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
            const activeV = viewMode === 'PLANNING_NUIT' ? vehiclesNuit : vehiclesJour;
            const totalVehicles = activeV.filter(v => v.assignments?.length > 0).length;
            const validatedVehicles = activeV.filter(v => v.assignments?.[0]?.status === 'VALIDATED').length;
            return { 
                label: `Planification : Véhicules (${validatedVehicles}/${totalVehicles}) • Personnes (${validated} / ${totalPersons})`, 
                className: "bg-orange-100 text-orange-800 border-orange-300 font-bold shadow-sm" 
            };
        }

        return { label: "Planification en avance", className: "bg-blue-50 text-blue-600 border-blue-200" };
    };

    const statusObj = getStatusDisplay();

    return (
        <div className="flex flex-col gap-4 p-3 sm:p-6 pb-24 overflow-x-hidden">
            {/* Header / Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                        <div className="p-2.5 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-500/20">
                            <CalendarIcon size={24} />
                        </div>
                        Régulation
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

                    <div className={`px-4 py-2 rounded-xl border-2 ${statusObj.className} flex items-start sm:items-center gap-2 min-h-[48px] w-full sm:w-auto`}>
                        <div className={`w-2 h-2 rounded-full mt-1 sm:mt-0 flex-shrink-0 ${statusObj.className.includes('blue') ? 'bg-blue-500' : statusObj.className.includes('orange') ? 'bg-orange-500' : statusObj.className.includes('green') ? 'bg-green-500' : statusObj.className.includes('purple') ? 'bg-purple-500' : 'bg-slate-500'}`}></div>
                        <span className="text-xs sm:text-sm leading-tight font-medium">{statusObj.label}</span>
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
            <div className="flex w-full overflow-x-auto hide-scrollbar bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 gap-1">
                <button
                    onClick={() => setViewMode('PLANNING_JOUR')}
                    className={`flex-none px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                        viewMode === 'PLANNING_JOUR' 
                            ? 'bg-white shadow-sm text-slate-900 border border-slate-200' 
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Plan. Jour (5H30)
                </button>
                <button
                    onClick={() => setViewMode('PLANNING_NUIT')}
                    className={`flex-none px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                        viewMode === 'PLANNING_NUIT' 
                            ? 'bg-slate-900 shadow-sm text-white border border-slate-800' 
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Plan. Nuit (19H30)
                </button>
                <button
                    onClick={() => setViewMode('REGULATION')}
                    className={`flex-none px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                        viewMode === 'REGULATION' 
                            ? 'bg-orange-500 shadow-sm text-white border border-orange-600' 
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Régulation
                </button>
                <button
                    onClick={() => setViewMode('DISPO')}
                    className={`flex-none px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                        viewMode === 'DISPO' 
                            ? 'bg-blue-600 shadow-sm text-white border border-blue-700' 
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Dispo
                </button>
                <button
                    onClick={() => setViewMode('HISTORY')}
                    className={`flex-none px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                        viewMode === 'HISTORY' 
                            ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white border' 
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    Historique
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
            ) : viewMode === 'REGULATION' ? (
                <RegulationTab data={regulationData} personnel={personnel} dateStr={format(date, 'yyyy-MM-dd')} onSuccess={loadData} globalAssignedIds={globalAssignedIds} />
            ) : viewMode === 'DISPO' ? (
                <DispoTab data={dispoData} personnel={personnel} vehicles={[...vehiclesJour, ...vehiclesNuit]} dateStr={format(date, 'yyyy-MM-dd')} onSuccess={loadData} globalAssignedIds={globalAssignedIds} />
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
                        {filteredVehicles.map(vehicle => {
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
                                    assignmentId={assignment?.id}
                                    onDelete={async (id, e) => {
                                        e.preventDefault()
                                        if (confirm("⚠️ SUPPRESSION ÉQUIPAGE : Voulez-vous vraiment effacer cet équipage du planning ?\n\nCette action libérera les deux salariés pour une autre affectation.")) {
                                            await deletePlanningAssignment(id)
                                            loadData()
                                        }
                                    }}
                                    onClick={() => {
                                        setSelectedVehicle(vehicle)
                                        setIsDialogOpen(true)
                                    }}
                                />
                            )
                        })}
                    </div>
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
                    personnel={viewMode === 'PLANNING_NUIT' ? personnel.filter(p => p.shift === 'NUIT' || p.shift === 'JOUR_NUIT') : personnel}
                    globalAssignedIds={globalAssignedIds}
                    onSuccess={() => loadData()}
                    defaultTime={viewMode === 'PLANNING_NUIT' ? '19:30' : '05:30'}
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
