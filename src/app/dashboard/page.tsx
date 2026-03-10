export const dynamic = "force-dynamic";
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const roles = (session.user as any).roles || [];

    if (roles.includes("ADMIN") || roles.includes("RH")) {
        redirect("/dashboard/rh")
    } else {
        redirect("/dashboard/salarie")
    }
}
