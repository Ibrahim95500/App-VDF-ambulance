export const dynamic = "force-dynamic";
import { Fragment } from 'react';
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Container } from '@/components/common/container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdvanceRequests } from '@/services/advance-request';
import { getAllLeaveRequests } from '@/services/leave-requests';
import { getAllServiceRequests } from '@/services/service-request';
import { getAppointmentRequests } from '@/services/appointment-request';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { HRStatsCharts } from './components/hr-stats-charts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default async function RHDashboard() {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "RH") {
        redirect("/dashboard/salarie")
    }

    const allRequests = await getAdvanceRequests()
    const pendingRequests = allRequests.filter(req => req.status === 'PENDING')

    const allLeaves = await getAllLeaveRequests()
    const pendingLeaves = allLeaves.filter(req => req.status === 'PENDING')

    const allServices = await getAllServiceRequests()
    const pendingServices = allServices.filter(req => req.status === 'PENDING')

    const allAppointments = await getAppointmentRequests()
    const pendingAppointments = allAppointments.filter(req => req.status === 'PENDING')

    // Aggregate data for charts
    const categoryCounts: Record<string, number> = {}
    const userCounts: Record<string, number> = {}
    const monthCounts: Record<string, number> = {}

    const sortedServices = [...allServices].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    sortedServices.forEach(req => {
        // Category
        const cat = req.category || 'Non catégorisé'
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1

        // User
        const userName = req.user.firstName && req.user.lastName
            ? `${req.user.firstName} ${req.user.lastName}`
            : req.user.name || req.user.email || 'Inconnu'
        userCounts[userName] = (userCounts[userName] || 0) + 1

        // Month
        const date = new Date(req.createdAt)
        const monthYearStr = format(date, 'MMM yyyy', { locale: fr })
        const monthYear = monthYearStr.charAt(0).toUpperCase() + monthYearStr.slice(1)
        monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1
    })

    const requestsByCategory = Object.entries(categoryCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    const requestsByUser = Object.entries(userCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    const requestsByMonth = Object.keys(monthCounts).map(name => ({ name, value: monthCounts[name] }))

    // Aggregate data for Rendez-vous charts
    const rdvStatusCounts: Record<string, number> = {}
    const rdvUserCounts: Record<string, { rdv: number, convocation: number }> = {}
    const rdvMonthCounts: Record<string, number> = {}
    const sortedAppointments = [...allAppointments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    sortedAppointments.forEach(req => {
        const statusMap: Record<string, string> = { 'PENDING': 'En attente', 'APPROVED': 'Approuvé', 'REJECTED': 'Refusé' }
        rdvStatusCounts[statusMap[req.status] || req.status] = (rdvStatusCounts[statusMap[req.status] || req.status] || 0) + 1
        const uName = (req.user as any)?.firstName && (req.user as any)?.lastName
            ? `${(req.user as any).firstName} ${(req.user as any).lastName}`
            : ((req.user as any)?.email || 'Inconnu')
        if (!rdvUserCounts[uName]) rdvUserCounts[uName] = { rdv: 0, convocation: 0 }
        if ((req as any).type === 'CONVOCATION') rdvUserCounts[uName].convocation += 1
        else rdvUserCounts[uName].rdv += 1
        const mYStr = format(new Date(req.createdAt), 'MMM yyyy', { locale: fr })
        const mY = mYStr.charAt(0).toUpperCase() + mYStr.slice(1)
        rdvMonthCounts[mY] = (rdvMonthCounts[mY] || 0) + 1
    })
    const rdvByStatus = Object.entries(rdvStatusCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    const rdvByUser = Object.entries(rdvUserCounts).map(([name, counts]) => ({ name, ...counts })).sort((a, b) => (b.rdv + b.convocation) - (a.rdv + a.convocation))
    const rdvByMonth = Object.keys(rdvMonthCounts).map(name => ({ name, value: rdvMonthCounts[name] }))

    // Aggregate data for Advance Requests charts
    const advanceStatusCounts: Record<string, number> = {}
    const advanceUserCounts: Record<string, number> = {}
    const advanceMonthCounts: Record<string, number> = {}

    const sortedAdvances = [...allRequests].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    sortedAdvances.forEach(req => {
        // Status mapping
        const statusMap: Record<string, string> = {
            'PENDING': 'En attente',
            'APPROVED': 'Approuvé',
            'REJECTED': 'Refusé'
        };
        const status = statusMap[req.status] || req.status;
        advanceStatusCounts[status] = (advanceStatusCounts[status] || 0) + 1

        // User
        const userName = req.user.name || req.user.email || 'Inconnu'
        advanceUserCounts[userName] = (advanceUserCounts[userName] || 0) + 1

        // Month
        const date = new Date(req.createdAt)
        const monthYearStr = format(date, 'MMM yyyy', { locale: fr })
        const monthYear = monthYearStr.charAt(0).toUpperCase() + monthYearStr.slice(1)
        advanceMonthCounts[monthYear] = (advanceMonthCounts[monthYear] || 0) + 1
    })

    const advanceByCategory = Object.entries(advanceStatusCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    const advanceByUser = Object.entries(advanceUserCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    const advanceByMonth = Object.keys(advanceMonthCounts).map(name => ({ name, value: advanceMonthCounts[name] }))

    const formatLeaveType = (type: string) => {
        if (type === 'CP') return 'Congé payé (CP)';
        if (type === 'MA') return 'Maladie (MA)';
        return 'Congé sans solde (CSS)';
    }

    return (
        <Fragment>
            <Container className="pt-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <Home className="size-8 text-secondary" />
                        <h1 className="text-3xl font-bold tracking-tight text-secondary">
                            Espace RH
                        </h1>
                    </div>
                    <p className="text-muted-foreground ml-[2.75rem]">
                        Bienvenue {(session.user as any).name || session.user.email}
                    </p>
                </div>
            </Container>

            <Container>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Colonne de gauche: Acomptes */}
                    <div className="flex flex-col gap-8">
                        {/* Advance Requests Card */}
                        <Card className="border-secondary/50 shadow-sm border-t-4 border-t-secondary">
                            <CardHeader className="pb-3 border-b border-border">
                                <CardTitle className="text-base font-semibold">Demandes d'Acompte en Attente</CardTitle>
                                <CardDescription>
                                    {pendingRequests.length} demande(s) nécessite(nt) votre attention.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="flex flex-col">
                                    {pendingRequests.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-8 bg-muted/20 text-muted-foreground text-sm italic">
                                            Aucune demande en attente de validation.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border">
                                            {pendingRequests.slice(0, 4).map((req) => (
                                                <div key={req.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        {req.user.image ? (
                                                            <img src={req.user.image} className="w-8 h-8 rounded-full bg-border" alt="" />
                                                        ) : (
                                                            <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary font-semibold rounded-full border border-primary/20 text-xs">
                                                                {req.user.name?.charAt(0) || req.user.email?.charAt(0) || '?'}
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-foreground">{req.user.name || req.user.email}</span>
                                                            <span className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleDateString('fr-FR')}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-foreground">{req.amount} €</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t border-border bg-muted/10 rounded-b-xl flex justify-center">
                                    <Link href="/dashboard/rh/acomptes">
                                        <Button variant="outline" size="sm" className="w-full max-w-[200px]">
                                            Voir toutes les demandes
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        <HRStatsCharts
                            requestsByCategory={advanceByCategory}
                            requestsByUser={advanceByUser}
                            requestsByMonth={advanceByMonth}
                            title="Statistiques des Acomptes"
                            description="Analyse financière des demandes d'acomptes."
                            categoryLabel="Par Statut"
                        />
                    </div>

                    {/* Colonne de droite: Services */}
                    <div className="flex flex-col gap-8">
                        {/* Service Requests Card */}
                        <Card className="border-secondary/50 shadow-sm border-t-4 border-t-secondary">
                            <CardHeader className="pb-3 border-b border-border">
                                <CardTitle className="text-base font-semibold">Demandes de Service en Attente</CardTitle>
                                <CardDescription>
                                    {pendingServices.length} demande(s) nécessite(nt) votre attention.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="flex flex-col">
                                    {pendingServices.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-8 bg-muted/20 text-muted-foreground text-sm italic">
                                            Aucune demande de service en attente.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border">
                                            {pendingServices.slice(0, 4).map((req) => (
                                                <div key={req.id} className="flex items-start justify-between p-4 hover:bg-muted/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        {(req.user as any).image ? (
                                                            <img src={(req.user as any).image} className="w-8 h-8 rounded-full bg-border" alt="" />
                                                        ) : (
                                                            <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary font-semibold rounded-full border border-primary/20 text-xs">
                                                                {req.user.name?.charAt(0) || req.user.email?.charAt(0) || '?'}
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-foreground">{req.user.name || req.user.email}</span>
                                                            <span className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleDateString('fr-FR')}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-semibold px-2 py-1 bg-muted rounded-md border border-border">{req.category || '-'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t border-border bg-muted/10 rounded-b-xl flex justify-center">
                                    <Link href="/dashboard/rh/services">
                                        <Button variant="outline" size="sm" className="w-full max-w-[200px]">
                                            Voir toutes les demandes
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        <HRStatsCharts
                            requestsByCategory={requestsByCategory}
                            requestsByUser={requestsByUser}
                            requestsByMonth={requestsByMonth}
                            title="Statistiques des Demandes (Services)"
                            description="Analyse des demandes de services RH, logistique, etc."
                        />
                    </div>

                    {/* Leave Requests Card (Hidden for now as requested by client) */}
                </div>

                {/* Statistiques Rendez-vous */}
                {allAppointments.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
                            Demandes de Rendez-vous et convocation
                        </h2>

                        {/* Appointment Requests Card */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <Card className="border-secondary/50 shadow-sm border-t-4 border-t-secondary">
                                <CardHeader className="pb-3 border-b border-border">
                                    <CardTitle className="text-base font-semibold">Rendez-vous en Attente</CardTitle>
                                    <CardDescription>
                                        {pendingAppointments.length} demande(s) nécessite(nt) votre attention.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="flex flex-col">
                                        {pendingAppointments.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center p-8 bg-muted/20 text-muted-foreground text-sm italic">
                                                Aucune demande en attente de validation.
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-border">
                                                {pendingAppointments.slice(0, 4).map((req) => (
                                                    <div key={req.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            {(req.user as any).image ? (
                                                                <img src={(req.user as any).image} className="w-8 h-8 rounded-full bg-border" alt="" />
                                                            ) : (
                                                                <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary font-semibold rounded-full border border-primary/20 text-xs">
                                                                    {req.user.name?.charAt(0) || req.user.email?.charAt(0) || '?'}
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-foreground">
                                                                    {req.user.firstName && req.user.lastName ? `${req.user.firstName} ${req.user.lastName}` : (req.user.name || req.user.email)}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleDateString('fr-FR')}</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-semibold px-2 py-1 bg-muted rounded-md border border-border">{(req as any).reason || '-'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 border-t border-border bg-muted/10 rounded-b-xl flex justify-center">
                                        <Link href="/dashboard/rh/rendez-vous">
                                            <Button variant="outline" size="sm" className="w-full max-w-[200px]">
                                                Voir toutes les demandes
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <HRStatsCharts
                            requestsByCategory={rdvByStatus}
                            requestsByUser={rdvByUser}
                            requestsByMonth={rdvByMonth}
                            hideUserTab={false}
                            categoryLabel="Par Statut"
                            title="Indicateurs de Rendez-vous"
                            description="RDV salariés et convocations RH — statuts, par salarié et évolution mensuelle."
                        />
                    </div>
                )}
            </Container>
        </Fragment>
    )
}
