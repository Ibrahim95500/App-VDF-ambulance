import { auth } from "@/auth";
import { Fragment } from "react";

export const dynamic = 'force-dynamic';
import { Container } from "@/components/common/container";
import {
    Toolbar,
    ToolbarDescription,
    ToolbarHeading,
} from '@/partials/common/toolbar';
import { ProfileForm } from "./profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserIcon, MailIcon, ShieldCheckIcon, PhoneIcon, CalendarIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
    const session = await auth();
    const sessionUser = session?.user;

    // Fetch full user data from database to get new fields (case-insensitive search)
    const user = sessionUser?.email
        ? await prisma.user.findFirst({
            where: {
                email: {
                    equals: sessionUser.email,
                    mode: 'insensitive'
                }
            }
        })
        : null;

    return (
        <Fragment>
            <Container>
                <Toolbar>
                    <ToolbarHeading>
                        <div className="flex items-center">
                            <h1 className="text-xl font-medium leading-none text-secondary">Mon Profil</h1>
                        </div>
                        <ToolbarDescription>
                            Gérez vos informations personnelles et la sécurité de votre compte.
                        </ToolbarDescription>
                    </ToolbarHeading>
                </Toolbar>
            </Container>

            <Container>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    {/* User Info Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-secondary/50 shadow-sm border-t-4 border-t-secondary overflow-hidden">
                            <div className="bg-secondary/10 p-6 flex flex-col items-center border-b border-border">
                                <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center text-secondary border-2 border-secondary/30 mb-4 shadow-inner">
                                    <UserIcon size={40} />
                                </div>
                                <h2 className="text-lg font-bold text-foreground text-center">
                                    {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.name || 'Utilisateur')}
                                </h2>
                                <span className="text-xs font-semibold px-2 py-1 bg-secondary text-secondary-foreground rounded-full mt-1 uppercase tracking-wider">
                                    {user?.role === 'RH' ? 'Administrateur RH' : 'Salarié'}
                                </span>
                            </div>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border text-sm">
                                    <div className="p-4 flex items-center gap-3">
                                        <UserIcon size={18} className="text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground/60 leading-none">Prénom / Nom</span>
                                            <span className="text-sm font-medium mt-1">{user?.firstName} {user?.lastName}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 flex items-center gap-3">
                                        <MailIcon size={18} className="text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground/60 leading-none">Email</span>
                                            <span className="text-sm font-medium mt-1">{user?.email}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 flex items-center gap-3">
                                        <PhoneIcon size={18} className="text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground/60 leading-none">Téléphone</span>
                                            <span className="text-sm font-medium mt-1 text-secondary">{user?.phone || 'Non renseigné'}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 flex items-center gap-3">
                                        <CalendarIcon size={18} className="text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground/60 leading-none">Date de naissance</span>
                                            <span className="text-sm font-medium mt-1 uppercase">
                                                {user?.birthDate ? new Date(user.birthDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Non renseignée'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 flex items-center gap-3">
                                        <ShieldCheckIcon size={18} className="text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground/60 leading-none">Status</span>
                                            <span className="text-sm font-medium text-green-600 mt-1 flex items-center gap-1">
                                                Compte Vérifié
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Password Form Area */}
                    <div className="lg:col-span-2">
                        <ProfileForm user={user} />
                    </div>
                </div>
            </Container>
        </Fragment >
    )
}
