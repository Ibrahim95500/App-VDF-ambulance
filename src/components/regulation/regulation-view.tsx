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

    // History State
    const [viewMode, setViewMode] = useState<'PLANNING' | 'HISTORY'>('PLANNING')
    const [historyData, setHistoryData] = useState<any[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    // Dialog State
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [date])

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

    const loadData = async () => {
        try {
            setLoading(true)
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
            setLoading(false)
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

    const currentHour = new Date().getHours();
    const isTomorrow = new Date(date).setHours(0,0,0,0) === new Date(new Date().setDate(new Date().getDate() + 1)).setHours(0,0,0,0);
    const isToday = new Date(date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0);
    const isPast = new Date(date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);

    let totalEquipages = 0;
    let validated = 0;
    vehicles.forEach(v => {
        if (v.assignments && v.assignments.length > 0) {
            totalEquipages++;
            if (v.assignments[0].status === 'CONFIRMED') validated++;
        }
    });

    const getStatusDisplay = () => {
        if (isPast) return { label: "Terminé (Historique)", className: "bg-slate-200 text-slate-800 border-slate-300" };
        if (isToday) return { label: "En service (Jour J)", className: "bg-purple-100 text-purple-800 border-purple-300" };
        
        if (isTomorrow) {
            if (currentHour < 19) {
                return { label: "Heure de Planification", className: "bg-blue-100 text-blue-800 border-blue-300 animate-pulse" };
            } else if (currentHour >= 19 && currentHour < 21) {
                return { label: `En cours de validation (${validated}/${totalEquipages} validés)`, className: "bg-orange-100 text-orange-800 border-orange-300 font-bold shadow-sm" };
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
                            />
                        </PopoverContent>
                    </Popover>

                    <div className={`px-4 py-2 rounded-xl border-2 ${statusObj.className} flex items-center gap-2 h-12`}>
                        <div className={`w-2 h-2 rounded-full ${statusObj.className.includes('blue') ? 'bg-blue-500' : statusObj.className.includes('orange') ? 'bg-orange-500' : statusObj.className.includes('green') ? 'bg-green-500' : statusObj.className.includes('purple') ? 'bg-purple-500' : 'bg-slate-500'}`}></div>
                        <span className="text-sm">{statusObj.label}</span>
                    </div>
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
                                status={assignment?.status}
                                startTime={assignment?.startTime}
                                endTime={assignment?.endTime}
                                onClick={() => {
                                    setSelectedVehicle(vehicle)
                                    setIsDialogOpen(true)
                                }}
                            />
                        )
                    })}
                </div>
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
                    onSuccess={loadData}
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
