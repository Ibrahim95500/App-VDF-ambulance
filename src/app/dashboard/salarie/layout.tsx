import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function SalarieLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    // Redirect HR users out of the salaried dashboard area to their designated dashboard
    if (session?.user && (session.user as any).role === "RH") {
        redirect("/dashboard/rh")
    }

    return (
        <div className="w-full">
            {children}
        </div>
    )
}
