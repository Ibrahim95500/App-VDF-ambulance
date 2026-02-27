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
import { AddCollaboratorForm } from '../components/add-collaborator-form';
import { CollaboratorsTable } from './collaborators-table';
import { getAllUsers } from '@/services/users';

export default async function CollaboratorsPage() {
    const session = await auth();
    // Use session.user.role if it's available or (session.user as any).role
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
                        <div className="flex items-center">
                            <h1 className="text-xl font-medium leading-none text-secondary">Collaborateurs</h1>
                        </div>
                        <ToolbarDescription>
                            Gérez les accès et consultez la liste des employés.
                        </ToolbarDescription>
                    </ToolbarHeading>
                </Toolbar>
            </Container>

            <Container className="space-y-8 mt-8">
                {/* Form to add collaborator */}
                <div className="max-w-3xl mx-auto">
                    <AddCollaboratorForm />
                </div>

                {/* List of collaborators */}
                <div className="pt-8 border-t border-border/50">
                    <h2 className="text-lg font-bold text-secondary mb-6">Liste des Collaborateurs</h2>
                    <CollaboratorsTable initialData={users as any} />
                </div>
            </Container>
        </Fragment>
    );
}
