export const dynamic = "force-dynamic";
import { Fragment } from 'react';
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Container } from '@/components/common/container';
import {
    Toolbar,
    ToolbarActions,
    ToolbarDescription,
    ToolbarHeading,
} from '@/partials/common/toolbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdvanceRequests } from '@/services/advance-request';
import { getAllLeaveRequests } from '@/services/leave-requests';
import Link from 'next/link';

export default async function RHDashboard() {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "RH") {
        redirect("/dashboard/salarie")
    }

    const allRequests = await getAdvanceRequests()
    const pendingRequests = allRequests.filter(req => req.status === 'PENDING')

    const allLeaves = await getAllLeaveRequests()
    const pendingLeaves = allLeaves.filter(req => req.status === 'PENDING')

    const formatLeaveType = (type: string) => {
        if (type === 'CP') return 'Congé payé (CP)';
        if (type === 'MA') return 'Maladie (MA)';
        return 'Congé sans solde (CSS)';
    }

    return (
        <Fragment>
            <Container>
                <Toolbar>
                    <ToolbarHeading>
                        <div className="flex items-center">
                            <h1 className="text-xl font-medium leading-none text-secondary">Espace RH</h1>
                        </div>
                        <ToolbarDescription>
                            Bienvenue {(session.user as any).name || session.user.email}
                        </ToolbarDescription>
                    </ToolbarHeading>
                </Toolbar>
            </Container>

            <Container>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
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

                    {/* Leave Requests Card */}
                    <Card className="border-secondary/50 shadow-sm border-t-4 border-t-secondary">
                        <CardHeader className="pb-3 border-b border-border">
                            <CardTitle className="text-base font-semibold">Demandes de Congés en Attente</CardTitle>
                            <CardDescription>
                                {pendingLeaves.length} demande(s) nécessite(nt) votre attention.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="flex flex-col">
                                {pendingLeaves.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-8 bg-muted/20 text-muted-foreground text-sm italic">
                                        Aucune demande de congé en attente.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border">
                                        {pendingLeaves.slice(0, 4).map((req) => (
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
                                                        <span className="text-xs text-muted-foreground">{formatLeaveType(req.type)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-xs font-medium text-foreground">
                                                        Du {new Date(req.startDate).toLocaleDateString('fr-FR')}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">{req.startAmPm}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-border bg-muted/10 rounded-b-xl flex justify-center">
                                <Link href="/dashboard/rh/conges">
                                    <Button variant="outline" size="sm" className="w-full max-w-[200px] border-primary text-primary hover:bg-primary/5">
                                        Gérer les congés
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Container>
        </Fragment>
    )
}
