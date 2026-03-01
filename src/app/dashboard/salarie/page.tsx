import { getMyAdvanceRequests } from "@/services/my-requests"
import { AdvanceRequestView } from "./advance-request-view"

export default async function SalarieDashboardPage() {
    const myRequests = await getMyAdvanceRequests()

    return <AdvanceRequestView myRequests={myRequests as any[]} />
}
