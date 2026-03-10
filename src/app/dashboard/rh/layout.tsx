import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function RHLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    const roles = session?.user ? (session.user as any).roles || [] : []
    const isAuthorized = roles.includes("RH") || roles.includes("REGULATEUR") || roles.includes("ADMIN")

    // Redirect unauthorized users out of the HR dashboard area
    if (!session?.user || !isAuthorized) {
        redirect("/dashboard/salarie")
    }

    return (
        <div className="w-full">
            {children}
        </div>
    )
}
