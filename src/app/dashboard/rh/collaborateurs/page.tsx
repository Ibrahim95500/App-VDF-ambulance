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
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-lg bg-secondary/10 text-secondary">
                                <UsersIcon className="size-5" />
                            </span>
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
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8 bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger value="list" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 py-2">
                            <UsersIcon className="size-4" />
                            <span className="hidden sm:inline">Liste des Collaborateurs</span>
                            <span className="sm:hidden text-xs">Liste</span>
                        </TabsTrigger>
                        <TabsTrigger value="add" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 py-2">
                            <UserPlusIcon className="size-4" />
                            <span className="hidden sm:inline">Ajouter un Collaborateur</span>
                            <span className="sm:hidden text-xs">Ajouter</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                        <div className="bg-white rounded-xl shadow-sm border border-border border-t-4 border-t-secondary overflow-hidden">
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
