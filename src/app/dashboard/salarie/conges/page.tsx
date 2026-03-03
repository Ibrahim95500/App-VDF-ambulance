export const dynamic = "force-dynamic";
import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import {
    Toolbar,
    ToolbarActions,
    ToolbarDescription,
    ToolbarHeading,
} from '@/partials/common/toolbar';
import { LeaveBalanceConfig } from './components/leave-balance';
import { LeaveHistory } from './components/leave-history';
import { LeaveForm } from './components/leave-form';
import { getMyLeaveRequests, getMyLeaveBalances } from '@/services/leave-requests';
import { CalendarIcon } from 'lucide-react';

export default async function CongesPage() {
    const myRequests = await getMyLeaveRequests();
    const myBalances = await getMyLeaveBalances();

    return (
        <Fragment>
            <Container>
                <Toolbar>
                    <ToolbarHeading>
                        <div className="flex items-center gap-3 mb-2">
                            <CalendarIcon className="size-8 text-secondary" />
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                Absences & Événements
                            </h1>
                        </div>
                        <ToolbarDescription>
                            Gérez vos soldes de congés, soumettez de nouvelles demandes et consultez votre historique.
                        </ToolbarDescription>
                    </ToolbarHeading>
                </Toolbar>
            </Container>

            <Container className="mt-8">
                {/* Top Section: Leave Balances */}
                <div className="mb-8">
                    <LeaveBalanceConfig balances={myBalances} />
                </div>

                {/* Bottom Section: Split History and Form */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <LeaveHistory requests={myRequests} />
                    <LeaveForm />
                </div>
            </Container>
        </Fragment>
    );
}
