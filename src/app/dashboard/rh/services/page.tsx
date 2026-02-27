export const dynamic = "force-dynamic";

import { getAllServiceRequests } from "@/services/service-request"
import { RHServiceRequestsTable } from "./services-table"
import { Container } from "@/components/common/container"

export default async function RHServicesPage() {
    const requests = await getAllServiceRequests()

    return (
        <Container className="py-8 space-y-8">
            <div className="flex bg-card text-card-foreground flex-col rounded-xl shadow-sm border border-border border-t-2 border-orange-500 pb-5">
                <div className="px-5 py-4 flex justify-between items-center border-b border-border bg-card">
                    <h2 className="text-lg font-bold text-foreground">Gestion des Demandes de Service</h2>
                </div>
                <div className="p-0">
                    <RHServiceRequestsTable initialData={requests} />
                </div>
            </div>
        </Container>
    )
}
