export const dynamic = "force-dynamic";

import { getAllServiceRequests } from "@/services/service-request"
import { RHServiceRequestsTable } from "./services-table"
import { Container } from "@/components/common/container"
import { BriefcaseIcon } from "lucide-react"

export default async function RHServicesPage() {
    const requests = await getAllServiceRequests()

    return (
        <Container className="py-8 space-y-8">
            <div className="flex bg-card text-card-foreground flex-col rounded-xl shadow-sm border border-border border-t-4 border-t-secondary pb-5">
                <div className="px-5 py-4 flex justify-between items-center border-b border-border bg-card">
                    <div className="flex items-center gap-3">
                        <BriefcaseIcon className="size-6 text-secondary" />
                        <h2 className="text-lg font-bold text-secondary">Gestion des Demandes de Service</h2>
                    </div>
                </div>
                <div className="p-0">
                    <RHServiceRequestsTable initialData={requests} />
                </div>
            </div>
        </Container>
    )
}
