import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ITSupportBoard } from './it-support-board';
import { ShieldAlert } from 'lucide-react';

export default async function ITSupportPage() {
    const session = await auth();
    const roles = (session?.user as any)?.roles || [];

    // Sécurité: Accès réservé aux dev/IT et ADMIN
    if (!roles.includes('SERVICE_IT') && !roles.includes('ADMIN')) {
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
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <ShieldAlert className="h-8 w-8 text-blue-600" />
                        Centre de Support IT (ServiceNow)
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Gérez les incidents techniques signalés par vos collaborateurs.
                    </p>
                </div>
            </div>

            {/* Le composant client qui gère les 2 vues */}
            <ITSupportBoard initialTickets={tickets} />
        </div>
    );
}
