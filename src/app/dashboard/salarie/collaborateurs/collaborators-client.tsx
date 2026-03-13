"use client"

import { useState, useMemo, Fragment, useEffect } from "react"
import { Container } from "@/components/common/container"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
    Users, 
    Search, 
    Shield,
    ShieldCheck, 
    ShieldAlert, 
    Briefcase,
    GraduationCap,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Eye,
    Phone,
    Mail,
    PhoneCall,
    Info,
    X,
    LayoutDashboard,
    ChevronLeft,
    ChevronRight,
    Zap
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { getUserDashboardStats } from "@/actions/users"
import { HRStatsCharts } from "../../rh/components/hr-stats-charts"

interface CollaboratorsClientProps {
    initialUsers: any[]
    session: any
}

export function CollaboratorsClient({ initialUsers, session }: CollaboratorsClientProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("dashboard")
    const [stats, setStats] = useState<any>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 9

    const myOublis = session?.user?.oubliCount ?? 0
    const isAdminOrRegul = session?.user?.roles?.some((r: string) => ['ADMIN', 'REGULATEUR'].includes(r)) || session?.user?.isRegulateur

    useEffect(() => {
        const fetchStats = async () => {
            const res = await getUserDashboardStats();
            if (res && !('error' in res)) {
                setStats(res);
            }
        };
        fetchStats();
    }, []);

    const filteredUsers = useMemo(() => {
        return initialUsers.filter(u => {
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase()
            const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                                 (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
            return matchesSearch && u.isActive !== false
        })
    }, [initialUsers, searchTerm])

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
    const currentUsers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filteredUsers.slice(start, start + itemsPerPage)
    }, [filteredUsers, currentPage])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    return (
        <Fragment>
            <Container className="pt-8 pb-12">
                <Tabs defaultValue="dashboard" className="w-full" onValueChange={setActiveTab}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                {activeTab === "dashboard" ? (
                                    <LayoutDashboard className="size-8 text-secondary" />
                                ) : (
                                    <Users className="size-8 text-secondary" />
                                )}
                                <h1 className="text-3xl font-bold tracking-tight text-secondary">
                                    {activeTab === "dashboard" ? "Mon Espace Personnel" : "Annuaire d'Entreprise"}
                                </h1>
                            </div>
                            <p className="text-muted-foreground ml-[2.7rem]">
                                {activeTab === "dashboard" 
                                    ? "Consultez vos statistiques de travail, vos démarches et votre situation." 
                                    : "Retrouvez et contactez facilement tous vos collègues VDF Ambulance."}
                            </p>
                        </div>

                        <TabsList className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                            <TabsTrigger 
                                value="dashboard" 
                                className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md px-8 py-2.5 font-bold transition-all group hover:text-secondary"
                            >
                                <LayoutDashboard className="size-4 mr-2 transition-colors group-hover:text-secondary group-data-[state=active]:text-secondary" />
                                <span className="transition-colors group-hover:text-secondary group-data-[state=active]:text-secondary font-black">Stats</span>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="annuaire" 
                                className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md px-8 py-2.5 font-bold transition-all group hover:text-secondary"
                            >
                                <Users className="size-4 mr-2 transition-colors group-hover:text-secondary group-data-[state=active]:text-secondary" />
                                <span className="transition-colors group-hover:text-secondary group-data-[state=active]:text-secondary font-black">Annuaire</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="dashboard" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
                        {/* Ma Situation Card - SOMBRE */}
                        <div className={`p-8 rounded-[2.5rem] border-2 flex flex-col md:flex-row items-center justify-between gap-8 transition-all shadow-2xl bg-slate-900 border-slate-800 relative overflow-hidden group`}>
                            {/* Éclat décoratif */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-secondary/20 transition-colors duration-700" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] -ml-32 -mb-32" />
                            
                            <div className="flex items-center gap-6 relative z-10">
                                <div className={`p-6 rounded-[1.5rem] text-white shadow-2xl transition-transform group-hover:scale-110 duration-500 ${myOublis >= 3 ? 'bg-gradient-to-br from-red-600 to-red-800 shadow-red-900/50 animate-pulse' : 'bg-gradient-to-br from-secondary to-orange-700 shadow-secondary/20'}`}>
                                    {myOublis >= 3 ? <ShieldAlert size={44} /> : <ShieldCheck size={44} />}
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Ma Situation Régulation</h2>
                                    <p className="text-slate-400 font-bold tracking-wide flex items-center gap-2">
                                        <Info size={18} className="text-secondary" />
                                        Compteur officiel des oublis de validation
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center md:items-end relative z-10">
                                <span className={`text-8xl font-black mb-1 drop-shadow-2xl ${myOublis >= 3 ? 'text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-orange-500' : 'text-transparent bg-clip-text bg-gradient-to-br from-secondary to-orange-400'}`}>{myOublis}</span>
                                <Badge variant={myOublis >= 3 ? "destructive" : "secondary"} className="font-black uppercase tracking-[0.2em] text-[10px] px-5 py-2 shadow-xl border-none">
                                    {myOublis > 1 ? "Oublis cumulés" : "Oubli cumulé"}
                                </Badge>
                            </div>

                            <div className="max-w-md w-full md:w-auto relative z-10">
                                {myOublis >= 3 ? (
                                    <div className="p-5 rounded-[2rem] bg-red-950/40 border border-red-900/50 backdrop-blur-xl shadow-2xl">
                                        <div className="flex items-center gap-2 text-red-500 font-black mb-2 uppercase tracking-widest text-xs">
                                            <AlertTriangle size={20} />
                                            <span>ACTION RH REQUISE</span>
                                        </div>
                                        <p className="text-sm text-red-300 leading-relaxed font-bold">
                                            Seuil critique atteint (3 oublis). Une convocation RH est à prévoir. Pensez à l'avenir à valider votre planning chaque jour.
                                        </p>
                                    </div>
                                ) : myOublis > 0 ? (
                                    <div className="p-5 rounded-[2rem] bg-amber-950/40 border border-amber-900/50 backdrop-blur-xl shadow-2xl">
                                        <div className="flex items-center gap-2 text-amber-500 font-black mb-2 uppercase tracking-widest text-xs">
                                            <Clock size={20} />
                                            <span>VIGILANCE CONSEILLÉE</span>
                                        </div>
                                        <p className="text-sm text-amber-300 leading-relaxed font-bold">
                                            Vous avez des oublis. Un rappel : validez votre planning chaque soir avant 21h pour rester à zéro.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-5 rounded-[2rem] bg-emerald-950/40 border border-emerald-900/50 backdrop-blur-xl shadow-2xl">
                                        <div className="flex items-center gap-2 text-emerald-500 font-black mb-2 uppercase tracking-widest text-xs">
                                            <CheckCircle2 size={20} />
                                            <span>SITUATION PARFAITE</span>
                                        </div>
                                        <p className="text-sm text-emerald-300 leading-relaxed font-bold">
                                            Zéro oubli ! Votre assiduité est exemplaire et contribue à la fluidité de la régulation. Bravo.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* BANDEAU INTERVENTIONS SEMAINE */}
                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-r from-blue-900/90 via-slate-900 to-orange-900/90 border-2 border-white/5 shadow-2xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
                           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="size-20 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-secondary shadow-inner group-hover:rotate-12 transition-transform duration-500">
                                        <Zap size={40} className="fill-secondary/20" />
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h3 className="text-2xl font-black text-white italic tracking-tighter">MES INTERVENTIONS</h3>
                                        <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Activité intense cette semaine</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-12 items-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-6xl font-black text-white tabular-nums drop-shadow-lg">{stats?.interventions?.thisWeek ?? 0}</span>
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Cette Semaine</span>
                                    </div>
                                    <div className="h-16 w-px bg-white/10 hidden md:block" />
                                    <div className="flex flex-col items-center">
                                        <span className="text-6xl font-black text-slate-500 tabular-nums drop-shadow-lg">{stats?.interventions?.total ?? 0}</span>
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Au total</span>
                                    </div>
                                </div>

                                <div className="hidden lg:block max-w-[200px] text-right">
                                    <p className="text-sm text-slate-400 font-bold leading-tight uppercase italic">
                                        Chaque mission compte. Votre engagement fait notre force collective.
                                    </p>
                                </div>
                           </div>
                        </div>

                        {/* Stats Perso - Design DASHBOARD RH */}
                        {stats && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <HRStatsCharts 
                                    title="Mes Acomptes" 
                                    description="Analyse de mes demandes d'acompte."
                                    requestsByCategory={stats.advances.byStatus}
                                    requestsByMonth={stats.advances.byMonth}
                                    requestsByUser={[]}
                                    hideUserTab={true}
                                    categoryLabel="Par Statut"
                                />
                                <HRStatsCharts 
                                    title="Mes Demandes (Services)" 
                                    description="Répartition de mes demandes logistiques."
                                    requestsByCategory={stats.services.byCategory}
                                    requestsByMonth={stats.services.byMonth}
                                    requestsByUser={[]}
                                    hideUserTab={true}
                                    categoryLabel="Par Catégorie"
                                />
                                <HRStatsCharts 
                                    title="Mes RDV & Convocations" 
                                    description="Suivi de mes rendez-vous RH."
                                    requestsByCategory={stats.appointments.byStatus}
                                    requestsByMonth={stats.appointments.byMonth}
                                    requestsByUser={[]}
                                    hideUserTab={true}
                                    categoryLabel="Par Statut"
                                />
                            </div>
                        )}
                        {!stats && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {[1,2,3].map(i => (
                                    <div key={i} className="h-[400px] w-full rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 animate-pulse flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="size-12 rounded-full bg-slate-200" />
                                            <div className="h-4 w-32 bg-slate-200 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="annuaire" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={28} />
                            <Input 
                                placeholder="Rechercher un collègue par nom ou prénom..." 
                                className="pl-16 h-20 rounded-[1.5rem] border-2 border-slate-200 focus-visible:ring-secondary text-2xl font-black shadow-xl transition-all focus:border-secondary/50 placeholder:text-slate-300 placeholder:font-bold italic"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* List - Cards style REGULATION avec DEGRAGES */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
                            {currentUsers.map(u => {
                                const isMark = u.structure === 'MARK';
                                const isVdf = u.structure === 'VDF';
                                const isBoth = u.structure === 'LES_2';
                                
                                return (
                                    <div 
                                        key={u.id} 
                                        className={cn(
                                            "relative overflow-hidden p-6 md:p-8 rounded-[2rem] md:rounded-[2.8rem] border-2 md:border-[3px] transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] group",
                                            isMark 
                                                ? "bg-gradient-to-br from-slate-900 via-slate-900 to-blue-900/40 border-slate-800 hover:border-blue-500/50 shadow-2xl" 
                                                : isVdf 
                                                    ? "bg-gradient-to-br from-slate-900 via-slate-900 to-orange-900/40 border-slate-800 hover:border-orange-500/50 shadow-2xl"
                                                    : isBoth
                                                        ? "bg-gradient-to-br from-slate-900 via-blue-900/30 to-orange-900/50 border-slate-800 hover:border-secondary shadow-2xl"
                                                        : "bg-white border-slate-100 shadow-xl hover:border-secondary/30"
                                        )}
                                    >
                                        {/* Accent color background decoration */}
                                        {(isMark || isVdf || isBoth) && (
                                            <Fragment>
                                                <div className={cn(
                                                    "absolute -right-20 -top-20 size-48 blur-[100px] opacity-10 transition-opacity duration-700 group-hover:opacity-40",
                                                    isMark ? "bg-blue-600" : isVdf ? "bg-orange-600" : "bg-gradient-to-br from-blue-600 to-orange-600"
                                                )} />
                                                <div className={cn(
                                                    "absolute -left-20 -bottom-20 size-40 blur-[80px] opacity-5 transition-opacity duration-700 group-hover:opacity-20",
                                                    isMark ? "bg-cyan-500" : isVdf ? "bg-yellow-500" : "bg-gradient-to-tr from-cyan-500 to-yellow-500"
                                                )} />
                                            </Fragment>
                                        )}

                                        <div className="flex items-start gap-4 md:gap-6 mb-6 md:mb-10 relative z-10">
                                            <div className="relative">
                                                {u.image ? (
                                                    <img src={u.image} className="size-16 md:size-24 rounded-[1.2rem] md:rounded-[1.8rem] object-cover ring-[4px] ring-slate-800/50 ring-offset-[4px] ring-offset-slate-900 transition-transform duration-500 group-hover:rotate-3 shadow-2xl" />
                                                ) : (
                                                    <div className={cn(
                                                        "size-16 md:size-24 rounded-[1.2rem] md:rounded-[1.8rem] flex items-center justify-center font-black text-2xl md:text-4xl border-[3px] transition-all duration-500 group-hover:-rotate-3 shadow-2xl",
                                                        isMark 
                                                            ? "bg-blue-600/10 text-blue-400 border-blue-500/30" 
                                                            : isVdf 
                                                                ? "bg-orange-600/10 text-orange-400 border-orange-500/30"
                                                                : isBoth
                                                                    ? "bg-gradient-to-br from-blue-600/10 to-orange-600/10 text-white border-white/20"
                                                                    : "bg-secondary/10 text-secondary border-secondary/30"
                                                    )}>
                                                        {u.firstName?.[0] || u.lastName?.[0] || '?'}
                                                    </div>
                                                )}
                                                {u.isRegulateur && (
                                                    <div className="absolute -right-2 -top-2 size-8 bg-blue-600 rounded-full border-4 border-slate-900 flex items-center justify-center text-white shadow-xl">
                                                        <Shield size={14} className="fill-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0 pt-1">
                                                <h3 className={cn(
                                                    "font-black text-base md:text-lg truncate leading-tight md:leading-none mb-1 md:mb-2 tracking-tighter",
                                                    isMark || isVdf || isBoth ? "text-white" : "text-slate-900"
                                                )}>
                                                    {u.firstName} <br/>
                                                    <span className={cn(
                                                        "opacity-90 block truncate",
                                                        isMark ? "text-blue-400" : isVdf ? "text-orange-400" : isBoth ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400" : "text-secondary"
                                                    )}>{u.lastName}</span>
                                                </h3>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {u.roles?.includes('RH') || u.roles?.includes('ADMIN') ? (
                                                        <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none text-[9px] px-3 py-1 uppercase font-black tracking-widest rounded-lg shadow-lg">Pilotage RH</Badge>
                                                    ) : u.isRegulateur ? (
                                                        <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-none text-[9px] px-3 py-1 uppercase font-black tracking-widest rounded-lg shadow-lg">Régulation</Badge>
                                                    ) : u.structure === 'VDF' ? (
                                                        <Badge className="bg-gradient-to-r from-orange-600 to-amber-600 text-white border-none text-[9px] px-3 py-1 uppercase font-black tracking-widest rounded-lg shadow-lg">VDF</Badge>
                                                    ) : u.structure === 'MARK' ? (
                                                        <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none text-[9px] px-3 py-1 uppercase font-black tracking-widest rounded-lg shadow-lg">MARK</Badge>
                                                    ) : u.structure === 'LES_2' ? (
                                                        <Badge className="bg-gradient-to-r from-blue-600 via-secondary to-orange-600 text-white border-none text-[9px] px-3 py-1 uppercase font-black tracking-widest rounded-lg shadow-lg">MIXTE</Badge>
                                                    ) : (
                                                        <Badge className="bg-slate-700 text-white border-none text-[9px] px-3 py-1 uppercase font-black tracking-widest rounded-lg">Collaborateur</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 md:block md:space-y-3 mb-6 md:mb-8 relative z-10 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] bg-white/5 border border-white/5 backdrop-blur-sm p-3">
                                            <div className={cn(
                                                "flex items-center gap-3 text-[0.8rem] font-black italic uppercase tracking-tight",
                                                isMark || isVdf || isBoth ? "text-slate-300" : "text-slate-600"
                                            )}>
                                                <div className={cn("p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors duration-500", isMark || isVdf || isBoth ? "bg-slate-800 group-hover:bg-slate-700" : "bg-slate-50")}>
                                                    <GraduationCap size={14} className={cn("md:size-4", isMark ? "text-blue-400" : isVdf ? "text-orange-400" : isBoth ? "text-secondary" : "text-secondary")} />
                                                </div>
                                                <span className="truncate">{u.diploma === 'DEA' ? 'DEA' : 'AUXI'}</span>
                                            </div>
                                            <div className={cn(
                                                "flex items-center gap-3 text-[0.8rem] font-black italic uppercase tracking-tight",
                                                isMark || isVdf || isBoth ? "text-slate-300" : "text-slate-600"
                                            )}>
                                                <div className={cn("p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors duration-500", isMark || isVdf || isBoth ? "bg-slate-800 group-hover:bg-slate-700" : "bg-slate-50")}>
                                                    <Briefcase size={14} className={cn("md:size-4", isMark ? "text-blue-400" : isVdf ? "text-orange-400" : isBoth ? "text-secondary" : "text-secondary")} />
                                                </div>
                                                <span className="truncate">Contrat {u.shift === 'JOUR' ? 'JOUR' : u.shift === 'NUIT' ? 'NUIT' : 'Vacataire'}</span>
                                            </div>
                                        </div>

                                        <div className="relative z-10 mt-auto flex flex-col gap-3">
                                            <Button 
                                                variant="secondary" 
                                                size="sm" 
                                                className={cn(
                                                    "w-full h-11 md:h-12 rounded-xl md:rounded-2xl font-black transition-all text-xs md:text-[0.85rem] uppercase tracking-tighter shadow-2xl group/btn overflow-hidden relative",
                                                    isMark 
                                                        ? "bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white border-none" 
                                                        : isVdf 
                                                            ? "bg-gradient-to-r from-orange-700 to-orange-500 hover:from-orange-600 hover:to-orange-400 text-white border-none"
                                                            : isBoth
                                                                ? "bg-gradient-to-r from-blue-600 via-secondary to-orange-600 hover:scale-[1.02] text-white border-none"
                                                                : "bg-slate-100 hover:bg-secondary hover:text-white text-slate-800 border-none"
                                                )}
                                                onClick={() => {
                                                    setSelectedUser(u)
                                                    setIsDialogOpen(true)
                                                }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                                <Eye className="size-5 mr-2 relative z-10" />
                                                <span className="relative z-10">Détails Collaborateur</span>
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Pagination UI */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-16 mb-12">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-[1.2rem] size-16 border-[3px] hover:bg-secondary hover:text-white hover:border-secondary transition-all shadow-xl"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                >
                                    <ChevronLeft size={32} />
                                </Button>
                                <div className="flex items-center gap-3">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <Button
                                            key={i}
                                            variant={currentPage === i + 1 ? "secondary" : "outline"}
                                            className={cn(
                                                "size-16 rounded-[1.2rem] text-2xl font-black border-[3px] transition-all transform active:scale-95",
                                                currentPage === i + 1 
                                                    ? "bg-secondary text-white border-secondary shadow-[0_15px_30px_-5px_rgba(249,115,22,0.4)] scale-110" 
                                                    : "border-slate-200 text-slate-300 hover:text-secondary hover:border-secondary/40 hover:shadow-lg"
                                            )}
                                            onClick={() => setCurrentPage(i + 1)}
                                        >
                                            {i + 1}
                                        </Button>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-[1.2rem] size-16 border-[3px] hover:bg-secondary hover:text-white hover:border-secondary transition-all shadow-xl"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                >
                                    <ChevronRight size={32} />
                                </Button>
                            </div>
                        )}
                        {filteredUsers.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in duration-500">
                                <div className="size-32 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200 mb-10 shadow-inner">
                                    <Search size={64} />
                                </div>
                                <h3 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter uppercase italic">Aucun membre trouvé</h3>
                                <p className="text-slate-400 max-w-sm text-xl font-bold italic">Vérifiez l'orthographe ou essayez un autre nom pour votre collègue.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </Container>

            {/* Profile Detail Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md w-full h-full sm:h-auto sm:w-[95vw] bg-slate-950 border-slate-900 text-white sm:rounded-[3.5rem] p-0 overflow-y-auto shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border-none sm:border-2 [&>button]:hidden top-0 translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
                    {/* Header Image/Pattern */}
                    <div className={cn(
                        "h-48 w-full relative",
                        selectedUser?.structure === 'MARK' ? "bg-gradient-to-br from-blue-900 to-blue-700" : selectedUser?.structure === 'VDF' ? "bg-gradient-to-br from-orange-900 to-orange-700" : "bg-gradient-to-br from-slate-800 to-slate-700"
                    )}>
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-6 right-6 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all size-12 shadow-2xl backdrop-blur-md z-50 flex items-center justify-center border border-white/5"
                            onClick={() => setIsDialogOpen(false)}
                        >
                            <X size={32} />
                        </Button>
                    </div>

                    <div className="px-12 pb-16 -mt-20 relative">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative group/avatar cursor-pointer">
                                {selectedUser?.image ? (
                                    <img src={selectedUser.image} className="size-40 rounded-[2.5rem] object-cover ring-[8px] ring-slate-950 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.5)] mb-8 scale-110 group-hover/avatar:scale-115 transition-transform duration-500" />
                                ) : (
                                    <div className="size-40 rounded-[2.5rem] bg-slate-900 border-[3px] border-white/10 flex items-center justify-center text-6xl font-black text-slate-700 ring-[8px] ring-slate-950 shadow-2xl mb-8 scale-110 group-hover/avatar:scale-115 transition-transform duration-500">
                                        {selectedUser?.firstName?.[0] || selectedUser?.lastName?.[0] || '?'}
                                    </div>
                                )}
                                <div className="absolute inset-0 rounded-[2.5rem] bg-secondary/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center scale-110">
                                    <Zap className="text-white size-10 animate-pulse" />
                                </div>
                            </div>

                            <h2 className="text-4xl font-black mb-3 tracking-tighter">{selectedUser?.firstName} <span className="text-secondary italic">{selectedUser?.lastName}</span></h2>
                            <div className="flex gap-3 mb-12">
                                <Badge variant="outline" className="border-slate-800 text-slate-600 bg-slate-900/50 uppercase text-[11px] tracking-[0.3em] font-black px-5 py-1.5 rounded-full">
                                    {selectedUser?.isRegulateur ? "Régulateur" : "Équipier VDF"}
                                </Badge>
                                <Badge className={cn(
                                    "border-none text-[11px] tracking-[0.3em] font-black uppercase px-5 py-1.5 rounded-full shadow-lg",
                                    selectedUser?.structure === 'MARK' ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" : selectedUser?.structure === 'VDF' ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white" : "bg-secondary text-white"
                                )}>
                                    {selectedUser?.structure || "VDF"}
                                </Badge>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-5 mb-12">
                                <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 hover:border-secondary/30 transition-all group/stat relative overflow-hidden shadow-inner">
                                    <div className="absolute top-0 right-0 size-16 bg-secondary/5 blur-2xl rounded-full" />
                                    <GraduationCap className="size-10 text-secondary mb-4 mx-auto transition-transform group-hover/stat:-rotate-12 duration-500" />
                                    <p className="text-[10px] text-slate-600 uppercase font-black tracking-[0.3em] mb-2">Diplôme</p>
                                    <p className="text-lg font-black text-slate-100 italic">{selectedUser?.diploma === 'DEA' ? 'DEA' : 'AUXI'}</p>
                                </div>
                                <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 hover:border-secondary/30 transition-all group/stat relative overflow-hidden shadow-inner">
                                    <div className="absolute top-0 right-0 size-16 bg-blue-600/5 blur-2xl rounded-full" />
                                    <Briefcase className="size-10 text-secondary mb-4 mx-auto transition-transform group-hover/stat:rotate-12 duration-500" />
                                    <p className="text-[10px] text-slate-600 uppercase font-black tracking-[0.3em] mb-2">Contrat</p>
                                    <p className="text-lg font-black text-slate-100 italic">{selectedUser?.shift || "JOURNEE"}</p>
                                </div>
                            </div>

                            <div className="w-full space-y-5">
                                {isAdminOrRegul && (
                                    <a 
                                        href={`tel:${selectedUser?.phone}`}
                                        className="flex items-center gap-6 w-full p-7 rounded-[2.2rem] bg-slate-900/80 hover:bg-slate-800 border-2 border-white/5 hover:border-secondary/50 transition-all group/link shadow-2xl relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-transparent opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                        <div className="size-16 rounded-[1.2rem] bg-secondary/10 flex items-center justify-center text-secondary group-hover/link:bg-secondary group-hover/link:text-white transition-all shadow-inner group-hover/link:scale-110 duration-500">
                                            <PhoneCall size={32} />
                                        </div>
                                        <div className="text-left flex-1 min-w-0 relative z-10">
                                            <p className="text-[10px] text-slate-600 uppercase font-black tracking-[0.4em] mb-1">Ligne Directe</p>
                                            <p className="text-2xl font-black text-slate-50 tabular-nums">{selectedUser?.phone || "Private"}</p>
                                        </div>
                                        <div className="size-12 rounded-full border border-white/5 flex items-center justify-center text-slate-700 group-hover/link:text-white group-hover/link:border-white/20 transition-all relative z-10">
                                            <ChevronRight size={24} />
                                        </div>
                                    </a>
                                )}

                                <a 
                                    href={`mailto:${selectedUser?.email}`}
                                    className="flex items-center gap-6 w-full p-7 rounded-[2.2rem] bg-slate-900/80 hover:bg-slate-800 border-2 border-white/5 hover:border-secondary/50 transition-all group/link shadow-2xl relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                    <div className="size-16 rounded-[1.2rem] bg-blue-600/10 flex items-center justify-center text-blue-400 group-hover/link:bg-blue-600 group-hover/link:text-white transition-all shadow-inner group-hover/link:scale-110 duration-500">
                                        <Mail size={32} />
                                    </div>
                                    <div className="text-left flex-1 min-w-0 relative z-10">
                                        <p className="text-[10px] text-slate-600 uppercase font-black tracking-[0.4em] mb-1">Email Pro</p>
                                        <p className="text-xl font-black text-slate-50 truncate">{selectedUser?.email}</p>
                                    </div>
                                    <div className="size-12 rounded-full border border-white/5 flex items-center justify-center text-slate-700 group-hover/link:text-white group-hover/link:border-white/20 transition-all relative z-10">
                                        <ChevronRight size={24} />
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 bg-slate-900/90 backdrop-blur-3xl flex flex-col items-center gap-2 border-t border-white/5 relative">
                        {/* Status d'équipage bien visible */}
                        <div className={cn(
                            "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl border flex items-center gap-2",
                            selectedUser?.isTeamLeader 
                                ? "bg-secondary/20 text-secondary border-secondary/30" 
                                : "bg-slate-800 text-slate-400 border-white/5"
                        )}>
                            <div className={cn("size-2 rounded-full animate-pulse", selectedUser?.isTeamLeader ? "bg-secondary" : "bg-slate-500")} />
                            {selectedUser?.isTeamLeader ? "Responsable d'équipage" : "Équipier d'équipage"}
                        </div>
                        <p className="text-[9px] text-slate-700 font-bold uppercase tracking-[0.3em] mt-2 italic">VDF Ambulance • Engagement & Excellence</p>
                    </div>
                </DialogContent>
            </Dialog>
        </Fragment>
    )
}
