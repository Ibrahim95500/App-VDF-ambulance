import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { RegulationView } from "@/components/regulation/regulation-view"

import { Container } from "@/components/common/container"

export default async function RegulationDashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const user = session.user as any
    const canAccess = user.roles?.includes('ADMIN') || user.roles?.includes('RH') || user.roles?.includes('REGULATEUR') || user.isRegulateur === true

    if (!canAccess) {
        redirect("/dashboard/salarie")
    }

    return (
        <Container className="pt-4 pb-10">
            <RegulationView />
        </Container>
    )
}
