export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/services/users";
import { CollaboratorsClient } from "./collaborators-client";

export default async function SalarieCollaborateursPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const users = await getAllUsers();
    
    // Force refresh the specific data in the session object for this page render
    // to avoid stale JWT data for the current user
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { oubliCount: true }
    });
    
    if (dbUser) {
        session.user.oubliCount = dbUser.oubliCount;
    }
    
    return <CollaboratorsClient initialUsers={users as any} session={session} />;
}
