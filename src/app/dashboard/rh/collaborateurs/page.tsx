export const dynamic = "force-dynamic";
import { Fragment } from 'react';
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Container } from '@/components/common/container';
import {
    Toolbar,
    ToolbarDescription,
    ToolbarHeading,
} from '@/partials/common/toolbar';
import { getAllLeaveRequests } from '@/services/leave-requests';
import { AddCollaboratorForm } from '../components/add-collaborator-form';
import { CollaboratorsTable } from './collaborators-table';
import { getAllUsers } from '@/services/users';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlusIcon, UsersIcon } from "lucide-react";

export default async function CollaboratorsPage() {
    const session = await auth();
    const role = (session?.user as any)?.role;

    if (!session?.user || (role !== "ADMIN" && role !== "RH")) {
        redirect("/dashboard/salarie");
    }

    const users = await getAllUsers();

    return (
        <Fragment>
            <Container>
                <Toolbar>
                    <ToolbarHeading>
                        <div className="flex items-center gap-3">
                            <UsersIcon className="size-6 text-secondary" />
                            <h1 className="text-xl font-medium leading-none text-secondary">Gestion des Collaborateurs</h1>
                        </div>
                        <ToolbarDescription>
                            Administrez les accès et coordonnez votre équipe d'ambulanciers.
                        </ToolbarDescription>
                    </ToolbarHeading>
                </Toolbar>
            </Container>

            <Container className="mt-8 pb-10">
                <Tabs defaultValue="list" className="w-full">
                    <TabsList className="flex items-center gap-2 sm:gap-4 bg-transparent p-0 mb-8">
                        <TabsTrigger
                            value="list"
                            className="rounded-xl border border-border data-[state=active]:border-secondary data-[state=active]:bg-secondary/10 data-[state=active]:text-secondary flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-3 transition-all text-muted-foreground font-bold min-w-0"
                        >
                            <UsersIcon className="size-4 shrink-0" />
                            <span className="truncate"><span className="hidden sm:inline">Liste des </span>Collaborateurs</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="add"
                            className="rounded-xl border border-border data-[state=active]:border-secondary data-[state=active]:bg-secondary/10 data-[state=active]:text-secondary flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-3 transition-all text-muted-foreground font-bold min-w-0"
                        >
                            <UserPlusIcon className="size-4 shrink-0" />
                            <span className="truncate"><span className="hidden sm:inline">Ajouter un </span>Collaborateur</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                        <div className="border border-border border-t-4 border-t-secondary rounded-xl overflow-hidden">
                            <CollaboratorsTable initialData={users as any} />
                        </div>
                    </TabsContent>

                    <TabsContent value="add" className="focus-visible:outline-none focus-visible:ring-0">
                        <div className="max-w-3xl mx-auto">
                            <AddCollaboratorForm />
                        </div>
                    </TabsContent>
                </Tabs>
            </Container>
        </Fragment>
    );
}
