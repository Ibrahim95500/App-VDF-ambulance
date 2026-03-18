import { auth } from "@/auth"
import { getMyAssignment, getMyRegulationHistory, getMyRegulation, getMyDisponibility } from "@/actions/regulation.actions"
import { MyAssignment } from "@/components/regulation/my-assignment"
import { MySpecialAssignment } from "@/components/regulation/my-special-assignment"
import { SalarieHistoryTable } from "@/components/regulation/salarie-history-table"
import { redirect } from "next/navigation"
import { format, addDays } from "date-fns"
import { fr } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"

export default async function SalarieRegulationPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    // 1. On cherche pour DEMAIN (Règle de base en forçant le fuseau horaire Paris)
    // Cela évite les décalages si le serveur est en UTC.
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
    const tomorrowDate = addDays(now, 1)
    const dateStrTomorrow = format(tomorrowDate, 'yyyy-MM-dd')
    
    // Paralléliser l'extraction des plannings (Ambulance, Régulation, Dispo)
    const [myAssignment, myRegulation, myDispo] = await Promise.all([
        getMyAssignment(session.user.id, dateStrTomorrow),
        getMyRegulation(session.user.id, dateStrTomorrow),
        getMyDisponibility(session.user.id, dateStrTomorrow)
    ])
    const showingDate = tomorrowDate

    // 3. Récupérer l'historique personnel
    const history = await getMyRegulationHistory(session.user.id)

    const dateDisplay = format(showingDate, "EEEE d MMMM", { locale: fr })

    return (
        <div className="flex flex-col gap-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h1 className="text-2xl font-black tracking-tighter uppercase">Ma Régulation Plateau</h1>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-muted-foreground text-sm font-medium">Consultez votre mission et votre historique de validation.</p>
                    {session.user.oubliCount > 0 && (
                        <Badge variant="destructive" className="animate-pulse h-7 px-3 font-black text-[11px] gap-2 border-2 border-red-500/20 shadow-lg shadow-red-500/10">
                            <AlertCircle size={14} />
                            {session.user.oubliCount} OUBLI{session.user.oubliCount > 1 ? 'S' : ''} SUR 3
                        </Badge>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto w-full px-2 sm:px-4">
                <Tabs defaultValue="mission" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <TabsTrigger value="mission" className="rounded-lg font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                            Ma Mission
                        </TabsTrigger>
                        <TabsTrigger value="history" className="rounded-lg font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                            Mon Historique
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="mission" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {myRegulation && <MySpecialAssignment assignment={myRegulation} type="REGULATION" />}
                        {myDispo && <MySpecialAssignment assignment={myDispo} type="DISPO" />}
                        
                        {(myAssignment || myRegulation || myDispo) ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mission prévue pour</span>
                                    <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                        {dateDisplay}
                                    </span>
                                </div>
                                {myAssignment && <MyAssignment assignment={myAssignment} />}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 text-center px-6">
                                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 mb-4 font-black">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tighter">Aucune mission assignée</h3>
                                <p className="text-slate-500 max-w-sm mt-2 text-sm font-medium">Vous n'avez pas encore de mission prévue pour aujourd'hui ou demain. Revenez plus tard ou contactez votre régulateur.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SalarieHistoryTable data={history} userId={session.user.id} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
