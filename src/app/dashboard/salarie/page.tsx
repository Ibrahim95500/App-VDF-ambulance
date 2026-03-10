import { auth } from "@/auth"
import { getMyAdvanceRequests } from "@/services/my-requests"
import { AdvanceRequestView } from "./advance-request-view"
import { getMyAssignment } from "@/actions/regulation.actions"
import { MyAssignment } from "@/components/regulation/my-assignment"

export default async function SalarieDashboardPage() {
    const myRequests = await getMyAdvanceRequests()

    return (
        <div className="flex flex-col gap-8">
            <AdvanceRequestView myRequests={myRequests as any[]} />
        </div>
    )
}
