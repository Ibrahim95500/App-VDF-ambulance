export const dynamic = "force-dynamic";

import { Fragment } from 'react';
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Container } from '@/components/common/container';
import { getAppointmentRequests } from '@/services/appointment-request';
import { CalendarRange } from 'lucide-react';
import { HRStatsCharts } from '../components/hr-stats-charts';
import { AppointmentsTable } from './appointments-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default async function RHRendezvousPage() {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "RH") {
        redirect("/dashboard/salarie")
    }

    const allRequests = await getAppointmentRequests()

    // Aggregate data for charts
    const statusCounts: Record<string, number> = {}
    const reasonCounts: Record<string, number> = {}
    const monthCounts: Record<string, number> = {}

    const sortedRequests = [...allRequests].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    sortedRequests.forEach(req => {
        // Status mapping
        const statusMap: Record<string, string> = {
            'PENDING': 'En attente',
            'APPROVED': 'Approuvé',
            'REJECTED': 'Refusé'
        };
        const status = statusMap[req.status] || req.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1

        // Reason
        const reason = req.reason || 'Autre'
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1

        // Month
        const date = new Date(req.createdAt)
        const monthYearStr = format(date, 'MMM yyyy', { locale: fr })
        const monthYear = monthYearStr.charAt(0).toUpperCase() + monthYearStr.slice(1)
        monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1
    })

    const requestsByStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    const requestsByReason = Object.entries(reasonCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    const requestsByMonth = Object.keys(monthCounts).map(name => ({ name, value: monthCounts[name] }))

    return (
        <Fragment>
            <Container className="pt-8 mb-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <CalendarRange className="size-8 text-secondary" />
                        <h1 className="text-3xl font-bold tracking-tight text-secondary" style={{ fontFamily: 'var(--font-dela-gothic)' }}>
                            Gestion des Rendez-vous
                        </h1>
                    </div>
                    <p className="text-muted-foreground ml-[2.75rem]">
                        Planifiez et gérez les demandes d'entretiens RH de vos collaborateurs.
                    </p>
                </div>
            </Container>

            <Container>
                {allRequests.length > 0 && (
                    <div className="mb-8">
                        <HRStatsCharts
                            requestsByCategory={requestsByStatus}
                            requestsByUser={requestsByReason}
                            requestsByMonth={requestsByMonth}
                            hideUserTab={false}
                            categoryLabel="Par Statut"
                            title="Indicateurs de Rendez-vous"
                            description="Visualisez les motifs, les statuts et l'évolution globale."
                        />
                    </div>
                )}

                <div className="mb-8">
                    <AppointmentsTable initialData={allRequests} />
                </div>
            </Container>
        </Fragment>
    )
}
