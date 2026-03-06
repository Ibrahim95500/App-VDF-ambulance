export const dynamic = "force-dynamic";

import { getAppointmentRequestsByUser } from "@/services/appointment-request"
import { auth } from "@/auth"
import { RequestAppointmentForm } from "./components/request-appointment-form"
import { AppointmentHistoryTable } from "./components/appointment-history-table"
import { Container } from "@/components/common/container"
import { CalendarDays } from "lucide-react"
import { redirect } from "next/navigation"

export default async function SalarieRendezvousPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect('/login')
    }

    const initialData = await getAppointmentRequestsByUser(session.user.id)

    return (
        <Container className="py-8 space-y-8">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <CalendarDays className="size-8 text-secondary" />
                    <h1 className="text-3xl font-bold tracking-tight text-secondary">
                        Demandes de Rendez-vous
                    </h1>
                </div>
                <p className="text-muted-foreground ml-[2.75rem]">
                    Sollicitez un entretien avec la direction RH (point carrière, administratif, etc.)
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Submit Form */}
                <div className="lg:col-span-1 border border-border border-t-4 border-t-secondary rounded-xl overflow-hidden h-fit bg-card p-2">
                    <RequestAppointmentForm />
                </div>

                {/* History Table */}
                <div className="lg:col-span-2 border border-border border-t-4 border-t-secondary rounded-xl overflow-hidden h-fit bg-card">
                    <AppointmentHistoryTable initialData={initialData} />
                </div>
            </div>
        </Container>
    )
}
