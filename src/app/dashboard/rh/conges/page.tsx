export const dynamic = "force-dynamic";
import { Fragment } from 'react';
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Container } from '@/components/common/container';
import {
    Toolbar,
    ToolbarDescription,
    ToolbarHeading,
} from '@/partials/common/toolbar';
import { getAllLeaveRequests } from '@/services/leave-requests';
import { LeaveManagementTable } from './components/leave-management-table';

export default async function ManageLeavesPage() {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "RH") {
        redirect("/dashboard/salarie")
    }

    // Fetch all leave requests directly from the database through the service
    const leaves = await getAllLeaveRequests()

    return (
        <Fragment>
            <Container>
                <Toolbar>
                    <ToolbarHeading>
                        <h1 className="text-xl font-medium leading-none text-secondary">Gestion des Congés</h1>
                        <ToolbarDescription>
                            Gérez, validez ou refusez les demandes de congés et d'absences de vos collaborateurs.
                        </ToolbarDescription>
                    </ToolbarHeading>
                </Toolbar>
            </Container>

            <Container className="space-y-8">
                <div className="flex bg-card text-card-foreground flex-col rounded-xl shadow-sm border border-border border-t-2 border-orange-500 pb-5">
                    <div className="px-5 py-4 flex justify-between items-center border-b border-border bg-card">
                        <h2 className="text-lg font-bold text-foreground">Gestion des Congés</h2>
                    </div>
                    <div className="p-0 overflow-x-auto w-full">
                        <LeaveManagementTable initialLeaves={leaves} />
                    </div>
                </div>
            </Container>
        </Fragment>
    )
}
