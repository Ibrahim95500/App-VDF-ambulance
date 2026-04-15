import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { UserSupportBoard } from './user-support-board';
import { LifeBuoy } from 'lucide-react';

export default async function UserSupportPage() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        redirect('/dashboard');
    }

    const tickets = await prisma.supportTicket.findMany({
        where: { userId },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    roles: true,
                    image: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-200 p-4 sm:p-8 rounded-xl ring-1 ring-slate-800 shadow-2xl">
            <div className="mb-6">
                <h1 className="text-3xl font-extrabold flex items-center gap-3 text-white tracking-tight">
                    <LifeBuoy className="h-8 w-8 text-blue-500" />
                    Signaler un Bug
                </h1>
                <p className="text-slate-400 mt-2 text-sm max-w-2xl">
                    Un bouton qui ne marche pas ? Un problème d'affichage ? Déclarez-le ici pour que l'équipe technique puisse le corriger rapidement.
                </p>
            </div>

            {/* Le composant client qui gère les KPI et les 2 vues */}
            <UserSupportBoard initialTickets={tickets} />
        </div>
    );
}
