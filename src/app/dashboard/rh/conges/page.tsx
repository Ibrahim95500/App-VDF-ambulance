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
import { CalendarIcon } from 'lucide-react';

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
                <div className="flex flex-col rounded-xl border border-border border-t-4 border-t-secondary pb-5">
                    <div className="px-5 py-4 flex justify-between items-center border-b border-border">
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="size-6 text-secondary" />
                            <h2 className="text-lg font-bold text-secondary">Gestion des Congés</h2>
                        </div>
                    </div>
                    <div className="p-0 overflow-x-auto w-full">
                        <LeaveManagementTable initialLeaves={leaves} />
                    </div>
                </div>
            </Container>
        </Fragment>
    )
}
