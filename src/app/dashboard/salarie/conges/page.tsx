export const dynamic = "force-dynamic";
import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { LeaveBalanceConfig } from './components/leave-balance';
import { LeaveHistory } from './components/leave-history';
import { LeaveForm } from './components/leave-form';
import { getMyLeaveRequests, getMyLeaveBalances } from '@/services/leave-requests';
import { CalendarClock } from 'lucide-react';

export default async function CongesPage() {
    const myRequests = await getMyLeaveRequests();
    const myBalances = await getMyLeaveBalances();

    return (
        <Fragment>
            <Container className="pt-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <CalendarClock className="size-8 text-secondary" />
                        <h1 className="text-3xl font-bold tracking-tight text-secondary">
                            Absences & Événements
                        </h1>
                    </div>
                    <p className="text-muted-foreground ml-[2.75rem]">
                        Gérez vos soldes de congés, soumettez de nouvelles demandes et consultez votre historique.
                    </p>
                </div>
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
