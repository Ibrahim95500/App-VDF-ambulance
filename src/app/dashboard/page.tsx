export const dynamic = "force-dynamic";
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const role = (session.user as any).role

    if (role === "RH") {
        redirect("/dashboard/rh")
    } else {
        redirect("/dashboard/salarie")
    }
}
