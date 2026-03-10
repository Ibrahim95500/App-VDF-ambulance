import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function SalarieLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    const roles = (session?.user as any).roles || []
    // Redirect strict HR users (who are NOT admins) out of the salaried dashboard area
    if (session?.user && roles.includes("RH") && !roles.includes("ADMIN")) {
        redirect("/dashboard/rh")
    }

    return (
        <div className="w-full">
            {children}
        </div>
    )
}
