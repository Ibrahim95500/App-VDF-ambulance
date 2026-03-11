import { auth } from "@/auth"
import { getMyAssignment } from "@/actions/regulation.actions"
import { MyAssignment } from "@/components/regulation/my-assignment"
import { redirect } from "next/navigation"
import { format } from "date-fns"

export default async function SalarieRegulationPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    // On cherche l'assignation pour demain (par défaut)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = format(tomorrow, 'yyyy-MM-dd')

    const myAssignment = await getMyAssignment(session.user.id, dateStr)

    return (
        <div className="flex flex-col gap-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h1 className="text-2xl font-black tracking-tighter">Ma Régulation Plateau</h1>
                <p className="text-muted-foreground text-sm mt-1">Consultez et validez votre mission pour demain.</p>
            </div>

            <div className="max-w-5xl mx-auto w-full px-2 sm:px-4">
                {myAssignment ? (
                    <MyAssignment assignment={myAssignment} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 text-center px-6">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Aucune mission assignée</h3>
                        <p className="text-slate-500 max-w-sm mt-2">Vous n'avez pas encore de mission prévue pour demain. Revenez plus tard ou contactez votre régulateur.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
