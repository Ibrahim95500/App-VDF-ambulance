export const dynamic = "force-dynamic";

import { getMyServiceRequests } from "@/services/my-requests"
import { RequestServiceForm } from "./components/request-service-form"
import { ServiceHistoryTable } from "./components/service-history-table"
import { Container } from "@/components/common/container"

export default async function SalarieServicesPage() {
    const initialData = await getMyServiceRequests()

    return (
        <Container className="py-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Demandes de Service
                </h1>
                <p className="text-muted-foreground">
                    Soumettez et suivez vos demandes de matériel, RH ou autres besoins.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Submit Form */}
                <div className="lg:col-span-1">
                    <RequestServiceForm />
                </div>

                {/* History Table */}
                <div className="lg:col-span-2">
                    <ServiceHistoryTable initialData={initialData} />
                </div>
            </div>
        </Container>
    )
}
