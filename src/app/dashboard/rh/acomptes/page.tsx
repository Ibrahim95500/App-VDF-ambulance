export const dynamic = 'force-dynamic';
import { Fragment } from 'react';
import { getAdvanceRequests } from "@/services/advance-request"
import { auth } from "@/auth"
import { AcomptesTable } from "./acomptes-table"
import { Container } from '@/components/common/container';
import { EuroIcon } from "lucide-react"

export default async function AcomptesPage() {
    const session = await auth();
    const roles = (session?.user as any)?.roles || [];
    const isAdmin = roles.includes("ADMIN");
    
    const requests = await getAdvanceRequests()

    return (
        <Fragment>
            <Container className="pt-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <EuroIcon className="size-8 text-secondary" />
                        <h1 className="text-3xl font-bold tracking-tight text-secondary">
                            Gestion des Acomptes
                        </h1>
                    </div>
                    <p className="text-muted-foreground ml-[2.75rem]">
                        Gérez les demandes d'avances sur salaire de vos collaborateurs.
                    </p>
                </div>
            </Container>

            <Container className="mt-8 pb-10">
                <div className="border border-border border-t-4 border-t-secondary rounded-xl overflow-hidden">
                    <AcomptesTable initialData={requests} isAdmin={isAdmin} />
                </div>
            </Container>
        </Fragment>
    )
}
