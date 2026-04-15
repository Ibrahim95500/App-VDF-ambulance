import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ITSupportBoard } from './it-support-board';
import { ShieldAlert } from 'lucide-react';

import { ITSupportKpi } from './it-support-kpi';

export default async function ITSupportPage() {
    const session = await auth();
    const roles = (session?.user as any)?.roles || [];

    // Sécurité stricte: Accès exclusif au SERVICE_IT
    if (!roles.includes('SERVICE_IT')) {
        redirect('/dashboard');
    }

    // Récupérer tous les tickets triés par les plus récents
    const tickets = await prisma.supportTicket.findMany({
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
                    <ShieldAlert className="h-8 w-8 text-blue-500" />
                    Centre de Support IT
                </h1>
                <p className="text-slate-400 mt-2 text-sm max-w-2xl">
                    Tableau de bord de résolution technique. Gérez les incidents signalés par les collaborateurs et surveillez l'état de santé de la plateforme.
                </p>
            </div>

            {/* Le composant client qui gère les KPI et les 2 vues */}
            <ITSupportBoard initialTickets={tickets} />
        </div>
    );
}
