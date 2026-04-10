export const dynamic = "force-dynamic";
import { Fragment } from 'react';
import { getAllServiceRequests } from "@/services/service-request"
import { auth } from "@/auth"
import { RHServiceRequestsTable } from "./services-table"
import { Container } from "@/components/common/container"
import {
    Toolbar,
    ToolbarDescription,
    ToolbarHeading,
} from '@/partials/common/toolbar';
import { BriefcaseIcon } from "lucide-react"

export default async function RHServicesPage() {
    const session = await auth();
    const roles = (session?.user as any)?.roles || [];
    const isAdmin = roles.includes("ADMIN");
    
    const requests = await getAllServiceRequests()

    return (
        <Fragment>
            <Container>
                <Toolbar>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <BriefcaseIcon className="size-8 text-secondary" />
                            <h1 className="text-3xl font-bold tracking-tight text-secondary">
                                Gestion des Demandes de Service
                            </h1>
                        </div>
                        <p className="text-muted-foreground ml-[2.75rem]">
                            Consultez, approuvez ou refusez les demandes de service soumises par vos collaborateurs.
                        </p>
                    </div>
                </Toolbar>
            </Container>

            <Container className="mt-8 pb-10">
                <div className="border border-border border-t-4 border-t-secondary rounded-xl overflow-hidden">
                    <RHServiceRequestsTable initialData={requests} isAdmin={isAdmin} />
                </div>
            </Container>
        </Fragment>
    )
}
