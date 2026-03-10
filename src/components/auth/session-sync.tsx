'use client';

import { useSession } from "next-auth/react";
import { useEffect, useCallback, useRef } from "react";

export function SessionSync() {
    const { data: session, update, status } = useSession();
    const lastSyncRef = useRef<number>(0);

    const syncRoles = useCallback(async (force = false) => {
        // Éviter trop de requêtes (max 1 toutes les 30s) sauf si forcé
        const now = Date.now();
        if (!force && now - lastSyncRef.current < 30000) return;
        lastSyncRef.current = now;

        if (status !== "authenticated" || !session?.user?.email) return;

        try {
            const res = await fetch('/api/auth/sync-roles');
            if (!res.ok) return;

            const data = await res.json();

            const currentRoles = (session.user as any).roles || [];
            const currentIsReg = (session.user as any).isRegulateur;

            // Vérifier s'il y a un changement
            const rolesChanged = JSON.stringify(currentRoles.sort()) !== JSON.stringify(data.roles.sort());
            const regChanged = currentIsReg !== data.isRegulateur;

            if (rolesChanged || regChanged) {
                console.log("IAM Sync: Changement détecté, mise à jour de la session...");
                await update({
                    ...session,
                    user: {
                        ...session.user,
                        roles: data.roles,
                        isRegulateur: data.isRegulateur,
                    }
                });

                // Astuce de pirate (F5 automatique) demandée par l'utilisateur
                // On laisse 500ms à NextAuth pour écrire le nouveau cookie JWT avant de rafraîchir
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        } catch (err) {
            console.error("IAM Sync Error:", err);
        }
    }, [session, status, update]);

    useEffect(() => {
        if (status === "authenticated") {
            syncRoles(true); // Force la première synchro
        }
    }, [status, syncRoles]);

    return null; // Composant invisible
}
