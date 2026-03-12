export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/services/users";
import { CollaboratorsClient } from "./collaborators-client";

export default async function SalarieCollaborateursPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const users = await getAllUsers();
    
    return <CollaboratorsClient initialUsers={users as any} session={session} />;
}
