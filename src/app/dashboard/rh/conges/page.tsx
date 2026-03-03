export const dynamic = "force-dynamic";
import { Fragment } from 'react';
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Container } from '@/components/common/container';
import { getAllLeaveRequests } from '@/services/leave-requests';
import { LeaveManagementTable } from './components/leave-management-table';
import { CalendarClock } from 'lucide-react';

export default async function ManageLeavesPage() {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "RH") {
        redirect("/dashboard/salarie")
    }

    // Fetch all leave requests directly from the database through the service
    const leaves = await getAllLeaveRequests()

    return (
        <Fragment>
            <Container className="pt-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <CalendarClock className="size-8 text-secondary" />
                        <h1 className="text-3xl font-bold tracking-tight text-secondary">
                            Gestion des Congés
                        </h1>
                    </div>
                    <p className="text-muted-foreground ml-[2.75rem]">
                        Gérez, validez ou refusez les demandes de congés et d'absences de vos collaborateurs.
                    </p>
                </div>
            </Container>

            <Container className="mt-8 pb-10">
                <div className="border border-border border-t-4 border-t-secondary rounded-xl overflow-hidden">
                    <LeaveManagementTable initialLeaves={leaves} />
                </div>
            </Container>
        </Fragment>
    )
}
