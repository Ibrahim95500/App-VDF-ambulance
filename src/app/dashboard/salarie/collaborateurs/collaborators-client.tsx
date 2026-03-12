"use client"

import { useState, useMemo, Fragment } from "react"
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
    Clock
} from "lucide-react"

interface CollaboratorsClientProps {
    initialUsers: any[]
    session: any
}

export function CollaboratorsClient({ initialUsers, session }: CollaboratorsClientProps) {
    const [searchTerm, setSearchTerm] = useState("")

    const myOublis = session?.user?.oubliCount ?? 0

    const filteredUsers = useMemo(() => {
        return initialUsers.filter(u => {
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase()
            const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                                 (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
            return matchesSearch && u.isActive !== false
        })
    }, [initialUsers, searchTerm])

    return (
        <Fragment>
            <Container className="pt-8">
                <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <Users className="size-8 text-secondary" />
                            <h1 className="text-3xl font-bold tracking-tight text-secondary">
                                Mes Collègues
                            </h1>
                        </div>
                        <p className="text-muted-foreground ml-[2.7rem]">
                            Retrouvez tous les membres de l'équipe VDF Ambulance.
                        </p>
                    </div>

                    {/* Ma Situation Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={`col-span-1 md:col-span-3 p-6 rounded-2xl border-2 flex flex-col md:flex-row items-center justify-between gap-6 transition-all shadow-sm ${myOublis >= 3 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-xl text-white shadow-lg ${myOublis >= 3 ? 'bg-red-600 shadow-red-200' : 'bg-secondary shadow-secondary/20'}`}>
                                    {myOublis >= 3 ? <ShieldAlert size={32} /> : <ShieldCheck size={32} />}
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className={`text-xl font-black ${myOublis >= 3 ? 'text-red-700' : 'text-secondary'}`}>Ma Situation Régulation</h2>
                                    <p className="text-sm font-medium text-muted-foreground">Compteur officiel des oublis de validation</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center md:items-end">
                                <span className={`text-5xl font-black mb-1 ${myOublis >= 3 ? 'text-red-600' : 'text-secondary'}`}>{myOublis}</span>
                                <Badge variant={myOublis >= 3 ? "destructive" : "outline"} className="font-bold uppercase tracking-widest text-[10px] px-3">
                                    {myOublis > 1 ? "Oublis cumulés" : "Oubli cumulé"}
                                </Badge>
                            </div>

                            {myOublis >= 3 ? (
                                <div className="max-w-xs text-center border-l-0 md:border-l-4 border-red-300 md:pl-6">
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-red-700 font-bold mb-1">
                                        <AlertTriangle size={16} />
                                        <span>Action Requise</span>
                                    </div>
                                    <p className="text-xs text-red-600 leading-tight">
                                        Vous avez atteint le seuil critique de 3 oublis. Une convocation RH est à prévoir prochainement.
                                    </p>
                                </div>
                            ) : myOublis > 0 ? (
                                <div className="max-w-xs text-center border-l-0 md:border-l-4 border-orange-300 md:pl-6">
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-orange-700 font-bold mb-1">
                                        <Clock size={16} />
                                        <span>Vigilance</span>
                                    </div>
                                    <p className="text-xs text-orange-600 leading-tight">
                                        Pensez à bien valider votre planning chaque soir avant 21h pour éviter d'augmenter votre compteur.
                                    </p>
                                </div>
                            ) : (
                                <div className="max-w-xs text-center border-l-0 md:border-l-4 border-green-300 md:pl-6">
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-green-700 font-bold mb-1">
                                        <CheckCircle2 size={16} />
                                        <span>Parfait</span>
                                    </div>
                                    <p className="text-xs text-green-600 leading-tight">
                                        Félicitations ! Votre assiduité est exemplaire. Continuez ainsi.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search & List */}
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <Input 
                                placeholder="Rechercher un collègue par nom ou prénom..." 
                                className="pl-12 h-14 rounded-2xl border-2 focus-visible:ring-secondary text-lg font-medium shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredUsers.map(u => (
                                <div key={u.id} className="p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-secondary/30 transition-all hover:shadow-md group">
                                    <div className="flex items-start gap-4 mb-4">
                                        {u.image ? (
                                            <img src={u.image} className="size-14 rounded-2xl object-cover border-2 border-slate-100" />
                                        ) : (
                                            <div className="size-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-black text-xl border-2 border-secondary/20">
                                                {u.firstName?.[0] || u.lastName?.[0] || '?'}
                                            </div>
                                        )}
                                        <div className="flex flex-col min-w-0">
                                            <h3 className="font-bold text-lg text-foreground truncate group-hover:text-secondary transition-colors leading-tight">
                                                {u.firstName} {u.lastName}
                                            </h3>
                                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                                {u.roles?.includes('RH') || u.roles?.includes('ADMIN') ? (
                                                    <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-600 border-purple-200 uppercase px-1.5 py-0">Direction / RH</Badge>
                                                ) : u.isRegulateur ? (
                                                    <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-600 border-blue-200 uppercase px-1.5 py-0">Régulateur</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-600 border-slate-200 uppercase px-1.5 py-0">Salarié</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 mt-auto">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                            <GraduationCap size={14} className="text-secondary/60" />
                                            <span>{u.diploma === 'DEA' ? 'Ambulancier DEA' : 'Auxiliaire de transport'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                            <Briefcase size={14} className="text-secondary/60" />
                                            <span>Contrat {u.shift === 'JOUR' ? 'Jour' : u.shift === 'NUIT' ? 'Nuit' : 'Vacataire'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                            <MapPin size={14} className="text-secondary/60" />
                                            <span>Structure {u.structure || 'VDF'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {filteredUsers.length === 0 && (
                            <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                <Search size={48} className="text-slate-300 mb-4" />
                                <p className="text-slate-500 font-bold">Aucun collègue ne correspond à votre recherche.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </Fragment>
    )
}
