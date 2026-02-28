export const dynamic = 'force-dynamic';
import { Fragment } from 'react';
import { getAdvanceRequests } from "@/services/advance-request"
import { AcomptesTable } from "./acomptes-table"
import { Container } from '@/components/common/container';
import {
    Toolbar,
    ToolbarDescription,
    ToolbarHeading,
} from '@/partials/common/toolbar';
import { EuroIcon } from "lucide-react"

export default async function AcomptesPage() {
    const requests = await getAdvanceRequests()

    return (
        <Fragment>
            <Container>
                <Toolbar>
                    <ToolbarHeading>
                        <div className="flex items-center gap-3">
                            <EuroIcon className="size-6 text-secondary" />
                            <h1 className="text-xl font-medium leading-none text-secondary">Gestion des Acomptes</h1>
                        </div>
                        <ToolbarDescription>
                            Gérez les demandes d'avances sur salaire de vos collaborateurs.
                        </ToolbarDescription>
                    </ToolbarHeading>
                </Toolbar>
            </Container>

            <Container className="mt-8 pb-10">
                <div className="border border-border border-t-4 border-t-secondary rounded-xl overflow-hidden">
                    <AcomptesTable initialData={requests} />
                </div>
            </Container>
        </Fragment>
    )
}
