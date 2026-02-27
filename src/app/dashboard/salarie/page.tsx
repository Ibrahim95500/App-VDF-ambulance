export const dynamic = "force-dynamic";
import { getMyAdvanceRequests } from "@/services/my-requests"
import { RequestAdvanceForm } from "./request-form"
import { AdvanceHistoryTable } from "./history-table"
import { EuroIcon } from "lucide-react"

export default async function SalarieDashboardPage() {
    const myRequests = await getMyAdvanceRequests()

    return (
        <div className="flex flex-col gap-5 lg:gap-7.5 max-w-5xl mx-auto w-full px-4 sm:px-0">
            <div className="flex items-center gap-3 mb-2">
                <EuroIcon className="size-8 text-secondary" />
                <h1 className="text-3xl font-bold tracking-tight text-secondary">
                    Mes Acomptes
                </h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5">

                {/* Left Column: Form */}
                <div className="lg:col-span-1">
                    <div className="flex flex-col rounded-xl border border-secondary/50 border-t-4 border-t-secondary">
                        <div className="px-5 py-4 border-b border-border">
                            <h2 className="text-base font-semibold text-secondary">Nouvelle demande d'acompte</h2>
                            <p className="text-sm text-muted-foreground mt-1">Saisissez le montant souhaité.</p>
                        </div>
                        <div className="p-5">
                            <RequestAdvanceForm />
                        </div>
                    </div>
                </div>

                {/* Right Column: History */}
                <div className="lg:col-span-2">
                    <div className="flex flex-col rounded-xl border border-secondary/50 border-t-4 border-t-secondary">
                        <div className="px-5 py-4 border-b border-border">
                            <h2 className="text-base font-semibold text-secondary">Historique de mes demandes</h2>
                        </div>
                        <div className="p-5">
                            <AdvanceHistoryTable initialData={myRequests as any} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
