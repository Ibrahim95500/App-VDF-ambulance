import { auth } from "@/auth"
import { getMyAdvanceRequests } from "@/services/my-requests"
import { AdvanceRequestView } from "./advance-request-view"
import { getMyAssignment } from "@/actions/regulation.actions"
import { MyAssignment } from "@/components/regulation/my-assignment"

export default async function SalarieDashboardPage() {
    const session = await auth()
    const myRequests = await getMyAdvanceRequests()

    // On cherche l'assignation pour demain (par défaut)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const myAssignment = session?.user?.id
        ? await getMyAssignment(session.user.id, tomorrow)
        : null

    return (
        <div className="flex flex-col gap-8">
            {myAssignment && (
                <div className="max-w-5xl mx-auto w-full px-2 sm:px-4">
                    <MyAssignment assignment={myAssignment} />
                </div>
            )}
            <AdvanceRequestView myRequests={myRequests as any[]} />
        </div>
    )
}
