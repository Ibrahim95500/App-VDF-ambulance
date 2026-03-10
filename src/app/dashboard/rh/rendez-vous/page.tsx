export const dynamic = "force-dynamic";

import { Fragment } from 'react';
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Container } from '@/components/common/container';
import { getAppointmentRequests } from '@/services/appointment-request';
import { CalendarRange } from 'lucide-react';
import { HRStatsCharts } from '../components/hr-stats-charts';
import { AppointmentsTable } from './appointments-table';
import { ConvocationFab } from './components/convocation-fab';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { prisma } from '@/lib/prisma';

export default async function RHRendezvousPage() {
    const session = await auth()
    const roles = (session?.user as any)?.roles || [];
    if (!session?.user || (!roles.includes("RH") && !roles.includes("ADMIN"))) {
        redirect("/dashboard/salarie")
    }

    const allRequests = await getAppointmentRequests()
    const employees = await prisma.user.findMany({
        where: { roles: { has: 'SALARIE' } },
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: { firstName: 'asc' }
    });

    // Aggregate data for charts
    const statusCounts: Record<string, number> = {}
    const userCounts: Record<string, { rdv: number, convocation: number }> = {}
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

        // By Employee Name
        const userName = (req.user as any)?.firstName && (req.user as any)?.lastName
            ? `${(req.user as any).firstName} ${(req.user as any).lastName}`
            : ((req.user as any)?.email || 'Inconnu');
        if (!userCounts[userName]) userCounts[userName] = { rdv: 0, convocation: 0 };
        if ((req as any).type === 'CONVOCATION') {
            userCounts[userName].convocation += 1;
        } else {
            userCounts[userName].rdv += 1;
        }

        // Month
        const date = new Date(req.createdAt)
        const monthYearStr = format(date, 'MMM yyyy', { locale: fr })
        const monthYear = monthYearStr.charAt(0).toUpperCase() + monthYearStr.slice(1)
        monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1
    })

    const requestsByStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    const requestsByUser = Object.entries(userCounts).map(([name, counts]) => ({ name, ...counts })).sort((a, b) => (b.rdv + b.convocation) - (a.rdv + a.convocation))
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
                <div className="mb-8 border border-border border-t-4 border-t-secondary rounded-xl overflow-hidden">
                    <AppointmentsTable initialData={allRequests} />
                </div>
            </Container>

            <ConvocationFab employees={employees} />
        </Fragment>
    )
}
