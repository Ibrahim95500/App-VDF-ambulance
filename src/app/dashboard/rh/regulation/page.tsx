import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { RegulationView } from "@/components/regulation/regulation-view"

export default async function RegulationDashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const user = session.user as any
    const canAccess = user.roles?.includes('RH') || user.roles?.includes('REGULATEUR') || user.isRegulateur === true

    if (!canAccess) {
        redirect("/dashboard/salarie")
    }

    return <RegulationView />
}
