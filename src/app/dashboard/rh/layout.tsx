import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function RHLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    // Redirect non-HR users out of the HR dashboard area
    if (!session?.user || (session.user as any).role !== "RH") {
        redirect("/dashboard/salarie")
    }

    return (
        <div className="w-full">
            {children}
        </div>
    )
}
