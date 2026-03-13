"use client"

import { useState, useMemo, Fragment, useEffect } from "react"
import { Container } from "@/components/common/container"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
    Users, 
    Search, 
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
                                    {activeTab === "dashboard" ? "Mon Tableau de bord" : "Annuaire de l'équipe"}
                                </h1>
                            </div>
                            <p className="text-muted-foreground ml-[2.7rem]">
                                {activeTab === "dashboard" 
                                    ? "Consultez vos statistiques personnelles et votre situation." 
                                    : "Retrouvez tous les membres de l'équipe VDF Ambulance."}
                            </p>
                        </div>

                        <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 transition-all">
                                <LayoutDashboard className="size-4 mr-2" />
                                Stats Perso
                            </TabsTrigger>
                            <TabsTrigger value="annuaire" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 transition-all">
                                <Users className="size-4 mr-2" />
                                Collègues
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="dashboard" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
                        {/* Ma Situation Card - SOMBRE */}
                        <div className={`p-8 rounded-3xl border-2 flex flex-col md:flex-row items-center justify-between gap-8 transition-all shadow-xl bg-slate-900 border-slate-800 relative overflow-hidden group`}>
                            {/* Éclat décoratif */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-secondary/20 transition-colors duration-500" />
                            
                            <div className="flex items-center gap-6 relative z-10">
                                <div className={`p-5 rounded-2xl text-white shadow-2xl ${myOublis >= 3 ? 'bg-red-600 shadow-red-900/50 animate-pulse' : 'bg-secondary shadow-secondary/20'}`}>
                                    {myOublis >= 3 ? <ShieldAlert size={40} /> : <ShieldCheck size={40} />}
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className="text-2xl font-black text-white mb-1">Ma Situation Régulation</h2>
                                    <p className="text-slate-400 font-medium tracking-wide flex items-center gap-2">
                                        <Info size={16} className="text-secondary" />
                                        Compteur officiel des oublis de validation
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center md:items-end relative z-10">
                                <span className={`text-7xl font-black mb-1 drop-shadow-md ${myOublis >= 3 ? 'text-red-500' : 'text-secondary'}`}>{myOublis}</span>
                                <Badge variant={myOublis >= 3 ? "destructive" : "secondary"} className="font-bold uppercase tracking-widest text-xs px-4 py-1.5 shadow-lg">
                                    {myOublis > 1 ? "Oublis cumulés" : "Oubli cumulé"}
                                </Badge>
                            </div>

                            <div className="max-w-md w-full md:w-auto relative z-10">
                                {myOublis >= 3 ? (
                                    <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 text-red-500 font-bold mb-2">
                                            <AlertTriangle size={18} />
                                            <span>ACTION RH REQUISE</span>
                                        </div>
                                        <p className="text-sm text-red-400/90 leading-relaxed font-medium">
                                            Seuil critique atteint (3 oublis). Une convocation RH est à prévoir. Pensez à l'avenir à valider votre planning.
                                        </p>
                                    </div>
                                ) : myOublis > 0 ? (
                                    <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-900/50 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 text-amber-500 font-bold mb-2">
                                            <Clock size={18} />
                                            <span>VIGILANCE CONSEILLÉE</span>
                                        </div>
                                        <p className="text-sm text-amber-400/90 leading-relaxed font-medium">
                                            Vous avez des oublis. Un rappel : validez votre planning chaque soir avant 21h pour rester à zéro.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-900/50 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 text-emerald-500 font-bold mb-2">
                                            <CheckCircle2 size={18} />
                                            <span>SITUATION PARFAITE</span>
                                        </div>
                                        <p className="text-sm text-emerald-400/90 leading-relaxed font-medium">
                                            Zéro oubli ! Votre assiduité est exemplaire et contribue à la fluidité de la régulation. Bravo.
                                        </p>
                                    </div>
                                )}
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
                                    <div key={i} className="h-[400px] w-full rounded-3xl bg-slate-50 border-2 border-slate-100 animate-pulse flex items-center justify-center">
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
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                            <Input 
                                placeholder="Rechercher un collègue par nom ou prénom..." 
                                className="pl-14 h-16 rounded-2xl border-2 border-slate-200 focus-visible:ring-secondary text-xl font-medium shadow-sm transition-all focus:border-secondary/50 placeholder:text-slate-300"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* List - Cards style REGULATION */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-2">
                            {currentUsers.map(u => {
                                const isMark = u.structure === 'MARK';
                                const isVdf = u.structure === 'VDF';
                                
                                return (
                                    <div 
                                        key={u.id} 
                                        className={cn(
                                            "relative overflow-hidden p-7 rounded-[2.5rem] border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group",
                                            isMark 
                                                ? "bg-slate-900 border-blue-900/50 hover:border-blue-500/50" 
                                                : isVdf 
                                                    ? "bg-slate-900 border-orange-900/50 hover:border-orange-500/50"
                                                    : "bg-white border-slate-100 shadow-sm hover:border-secondary/30"
                                        )}
                                    >
                                        {/* Accent color background decoration */}
                                        {(isMark || isVdf) && (
                                            <div className={cn(
                                                "absolute -right-16 -top-16 size-40 blur-[80px] opacity-10 transition-opacity group-hover:opacity-30",
                                                isMark ? "bg-blue-600" : "bg-orange-600"
                                            )} />
                                        )}

                                        <div className="flex items-start gap-5 mb-8 relative z-10">
                                            {u.image ? (
                                                <img src={u.image} className="size-20 rounded-[1.5rem] object-cover ring-2 ring-slate-800 ring-offset-2 ring-offset-slate-900" />
                                            ) : (
                                                <div className={cn(
                                                    "size-20 rounded-[1.5rem] flex items-center justify-center font-black text-3xl border-2 transition-transform duration-300 group-hover:rotate-6",
                                                    isMark 
                                                        ? "bg-blue-600/10 text-blue-400 border-blue-500/20" 
                                                        : isVdf 
                                                            ? "bg-orange-600/10 text-orange-400 border-orange-500/20"
                                                            : "bg-secondary/10 text-secondary border-secondary/20"
                                                )}>
                                                    {u.firstName?.[0] || u.lastName?.[0] || '?'}
                                                </div>
                                            )}
                                            <div className="flex flex-col min-w-0 pt-1">
                                                <h3 className={cn(
                                                    "font-black text-2xl truncate leading-tight mb-2",
                                                    isMark || isVdf ? "text-white" : "text-slate-900"
                                                )}>
                                                    {u.firstName} {u.lastName}
                                                </h3>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {u.roles?.includes('RH') || u.roles?.includes('ADMIN') ? (
                                                        <Badge className="bg-purple-600/90 text-white border-none text-[10px] px-2 py-0.5 uppercase font-black tracking-tighter">Direction / RH</Badge>
                                                    ) : u.isRegulateur ? (
                                                        <Badge className="bg-blue-600/90 text-white border-none text-[10px] px-2 py-0.5 uppercase font-black tracking-tighter">Régulateur</Badge>
                                                    ) : u.structure === 'VDF' ? (
                                                        <Badge className="bg-orange-500/90 text-white border-none text-[10px] px-2 py-0.5 uppercase font-black tracking-tighter">Équipe VDF</Badge>
                                                    ) : u.structure === 'MARK' ? (
                                                        <Badge className="bg-blue-500/90 text-white border-none text-[10px] px-2 py-0.5 uppercase font-black tracking-tighter">Équipe MARK</Badge>
                                                    ) : (
                                                        <Badge className="bg-slate-500/90 text-white border-none text-[10px] px-2 py-0.5 uppercase font-black tracking-tighter">Équipier</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4 mb-8 relative z-10">
                                            <div className={cn(
                                                "flex items-center gap-4 text-[0.9rem] font-bold",
                                                isMark || isVdf ? "text-slate-400" : "text-slate-500"
                                            )}>
                                                <div className={cn("p-2 rounded-xl", isMark || isVdf ? "bg-slate-800" : "bg-slate-50")}>
                                                    <GraduationCap size={18} className={isMark ? "text-blue-400" : isVdf ? "text-orange-400" : "text-secondary"} />
                                                </div>
                                                <span>{u.diploma === 'DEA' ? 'Ambulancier DEA' : 'Auxiliaire de transport'}</span>
                                            </div>
                                            <div className={cn(
                                                "flex items-center gap-4 text-[0.9rem] font-bold",
                                                isMark || isVdf ? "text-slate-400" : "text-slate-500"
                                            )}>
                                                <div className={cn("p-2 rounded-xl", isMark || isVdf ? "bg-slate-800" : "bg-slate-50")}>
                                                    <Briefcase size={18} className={isMark ? "text-blue-400" : isVdf ? "text-orange-400" : "text-secondary"} />
                                                </div>
                                                <span>Contrat {u.shift === 'JOUR' ? 'Jour' : u.shift === 'NUIT' ? 'Nuit' : 'Vacataire'}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 relative z-10">
                                            <Button 
                                                variant="secondary" 
                                                size="sm" 
                                                className={cn(
                                                    "w-full h-12 rounded-2xl font-black transition-all text-sm",
                                                    isMark 
                                                        ? "bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-900/20" 
                                                        : isVdf 
                                                            ? "bg-orange-600 hover:bg-orange-500 text-white border-none shadow-lg shadow-orange-900/20"
                                                            : "bg-slate-100 hover:bg-secondary hover:text-white text-slate-700 border-none"
                                                )}
                                                onClick={() => {
                                                    setSelectedUser(u)
                                                    setIsDialogOpen(true)
                                                }}
                                            >
                                                <Eye className="size-5 mr-3" />
                                                Voir Profil
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Pagination UI */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-12 mb-8">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-2xl size-14 border-2"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                >
                                    <ChevronLeft size={24} />
                                </Button>
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <Button
                                            key={i}
                                            variant={currentPage === i + 1 ? "secondary" : "outline"}
                                            className={cn(
                                                "size-14 rounded-2xl text-xl font-black border-2 transition-all",
                                                currentPage === i + 1 
                                                    ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20" 
                                                    : "border-slate-200 text-slate-400 hover:text-secondary hover:border-secondary/30"
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
                                    className="rounded-2xl size-14 border-2"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                >
                                    <ChevronRight size={24} />
                                </Button>
                            </div>
                        )}
                        {filteredUsers.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="size-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-8">
                                    <Search size={48} />
                                </div>
                                <h3 className="text-3xl font-black text-slate-800 mb-3">Aucun collègue trouvé</h3>
                                <p className="text-slate-400 max-w-sm text-lg font-medium">Réessayez avec un autre nom ou prénom pour trouver votre équipier.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </Container>

            {/* Profile Detail Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md bg-slate-950 border-slate-900 text-white rounded-[3rem] p-0 overflow-hidden shadow-2xl">
                    {/* Header Image/Pattern */}
                    <div className={cn(
                        "h-40 w-full relative",
                        selectedUser?.structure === 'MARK' ? "bg-blue-600/30" : selectedUser?.structure === 'VDF' ? "bg-orange-600/30" : "bg-secondary/30"
                    )}>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-6 right-6 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
                            onClick={() => setIsDialogOpen(false)}
                        >
                            <X size={24} />
                        </Button>
                    </div>

                    <div className="px-10 pb-12 -mt-16 relative">
                        <div className="flex flex-col items-center text-center">
                            {selectedUser?.image ? (
                                <img src={selectedUser.image} className="size-32 rounded-3xl object-cover ring-[6px] ring-slate-950 shadow-2xl mb-6 scale-110" />
                            ) : (
                                <div className="size-32 rounded-3xl bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-5xl font-black text-slate-600 ring-[6px] ring-slate-950 shadow-2xl mb-6 scale-110">
                                    {selectedUser?.firstName?.[0] || selectedUser?.lastName?.[0] || '?'}
                                </div>
                            )}

                            <h2 className="text-3xl font-black mb-2 tracking-tight">{selectedUser?.firstName} {selectedUser?.lastName}</h2>
                            <div className="flex gap-2 mb-10">
                                <Badge variant="outline" className="border-slate-800 text-slate-500 bg-slate-900/50 uppercase text-[10px] tracking-[0.2em] font-black px-3 py-1">
                                    {selectedUser?.isRegulateur ? "Régulateur" : "Équipier"}
                                </Badge>
                                <Badge className={cn(
                                    "border-none text-[10px] tracking-[0.2em] font-black uppercase px-3 py-1",
                                    selectedUser?.structure === 'MARK' ? "bg-blue-600 text-white" : selectedUser?.structure === 'VDF' ? "bg-orange-600 text-white" : "bg-secondary text-white"
                                )}>
                                    {selectedUser?.structure || "VDF"}
                                </Badge>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-4 mb-10">
                                <div className="bg-slate-900/50 p-5 rounded-[1.5rem] border border-slate-800 hover:border-slate-700 transition-all group">
                                    <GraduationCap className="size-7 text-secondary mb-3 mx-auto transition-transform group-hover:-rotate-12" />
                                    <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-1">Diplôme</p>
                                    <p className="text-base font-black text-slate-100">{selectedUser?.diploma === 'DEA' ? 'DEA' : 'Auxiliaire'}</p>
                                </div>
                                <div className="bg-slate-900/50 p-5 rounded-[1.5rem] border border-slate-800 hover:border-slate-700 transition-all group">
                                    <Briefcase className="size-7 text-secondary mb-3 mx-auto transition-transform group-hover:rotate-12" />
                                    <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-1">Contrat</p>
                                    <p className="text-base font-black text-slate-100">{selectedUser?.shift || "JOUR"}</p>
                                </div>
                            </div>

                            <div className="w-full space-y-4">
                                <a 
                                    href={`tel:${selectedUser?.phone}`}
                                    className="flex items-center gap-6 w-full p-6 rounded-[1.5rem] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-secondary/50 transition-all group shadow-xl"
                                >
                                    <div className="size-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all">
                                        <PhoneCall size={28} />
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-1">Téléphone mobile</p>
                                        <p className="text-xl font-black text-slate-50 truncate">{selectedUser?.phone || "Non renseigné"}</p>
                                    </div>
                                    <div className="size-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-600 group-hover:text-white group-hover:border-white/20 transition-all">
                                        <ChevronRight size={20} />
                                    </div>
                                </a>

                                <a 
                                    href={`mailto:${selectedUser?.email}`}
                                    className="flex items-center gap-6 w-full p-6 rounded-[1.5rem] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-secondary/50 transition-all group shadow-xl"
                                >
                                    <div className="size-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all">
                                        <Mail size={28} />
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-1">Email professionnel</p>
                                        <p className="text-xl font-black text-slate-50 truncate">{selectedUser?.email}</p>
                                    </div>
                                    <div className="size-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-600 group-hover:text-white group-hover:border-white/20 transition-all">
                                        <ChevronRight size={20} />
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="p-5 bg-slate-900/80 backdrop-blur-md flex justify-center border-t border-white/5">
                        <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em]">VDF Ambulance Digital Experience</p>
                    </div>
                </DialogContent>
            </Dialog>
        </Fragment>
    )
}
