export const dynamic = "force-dynamic";
import { Fragment } from 'react';
import { getAllServiceRequests } from "@/services/service-request"
import { RHServiceRequestsTable } from "./services-table"
import { Container } from "@/components/common/container"
import {
    Toolbar,
    ToolbarDescription,
    ToolbarHeading,
} from '@/partials/common/toolbar';
import { BriefcaseIcon } from "lucide-react"

export default async function RHServicesPage() {
    const requests = await getAllServiceRequests()

    return (
        <Fragment>
            <Container>
                <Toolbar>
                    <ToolbarHeading>
                        <div className="flex items-center gap-3">
                            <BriefcaseIcon className="size-6 text-secondary" />
                            <h1 className="text-xl font-medium leading-none text-secondary">Gestion des Demandes de Service</h1>
                        </div>
                        <ToolbarDescription>
                            Consultez, approuvez ou refusez les demandes de service soumises par vos collaborateurs.
                        </ToolbarDescription>
                    </ToolbarHeading>
                </Toolbar>
            </Container>

            <Container className="mt-8 pb-10">
                <div className="border border-border border-t-4 border-t-secondary rounded-xl overflow-hidden">
                    <RHServiceRequestsTable initialData={requests} />
                </div>
            </Container>
        </Fragment>
    )
}
