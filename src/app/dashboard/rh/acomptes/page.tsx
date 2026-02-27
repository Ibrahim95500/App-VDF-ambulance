import { getAdvanceRequests } from "@/services/advance-request"
import { AcomptesTable } from "./acomptes-table"

export const dynamic = 'force-dynamic'

export default async function AcomptesPage() {
    const requests = await getAdvanceRequests()

    return (
        <div className="flex flex-col gap-5 lg:gap-7.5">
            <div className="flex bg-card text-card-foreground flex-col rounded-xl shadow-sm border border-border border-t-2 border-secondary pb-5">
                <div className="px-5 py-4 flex justify-between items-center border-b border-border">
                    <h2 className="text-base font-semibold text-secondary">Demandes d'Acomptes (Global)</h2>
                </div>
                <div className="p-5">
                    <AcomptesTable initialData={requests} />
                </div>
            </div>
        </div>
    )
}
