"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { format } from "date-fns"

export async function generateDailyPlanningAI(dateStr: string, shift: 'JOUR' | 'NUIT' = 'JOUR') {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("Clé API Google Gemini introuvable dans le serveur.");
        }

        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)

        // 1. Récupérer les véhicules
        const allVehicles = await prisma.vehicle.findMany({
            orderBy: { plateNumber: 'asc' }
        });

        // 2. Récupérer les assignations existantes (pour ne pas écraser les choix du régulateur)
        const existingAssignments = await prisma.planningAssignment.findMany({
            where: {
                date: { gte: startOfDay, lte: endOfDay },
                startTime: shift === 'JOUR' ? { lt: "19:30" } : { gte: "19:30" }
            }
        });

        const assignedVehicleIds = new Set(existingAssignments.map(a => a.vehicleId));
        const assignedUserIds = new Set(existingAssignments.flatMap(a => [a.leaderId, a.teammateId].filter(id => id !== null)));

        const availableVehicles = allVehicles.filter(v => !assignedVehicleIds.has(v.id));
        
        // 3. Récupérer TOUS les employés
        let allUsers = await prisma.user.findMany({
            where: { 
                isActive: true,
                OR: [
                    { roles: { has: 'SALARIE' } },
                    { roles: { has: 'REGULATEUR' } },
                    { roles: { has: 'ADMIN' } }
                ]
            },
            select: { id: true, firstName: true, lastName: true, diploma: true, isTeamLeader: true, isRegulateur: true, roles: true, shift: true }
        });

        // On enlève du panier ceux qui sont déjà affectés
        let availableUsers = allUsers.filter(u => !assignedUserIds.has(u.id));

        if (availableVehicles.length === 0) return { error: "Tous les véhicules sont déjà assignés." };
        if (availableUsers.length < 2) return { error: "Pas assez d'employés disponibles pour faire des binômes." };

        // ==========================================
        // 🚀 AJOUT MACHINE LEARNING (HISTORIQUE) 🚀
        // ==========================================
        const fourteenDaysAgo = new Date(startOfDay);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const historyAssignments = await prisma.planningAssignment.findMany({
            where: {
                date: { gte: fourteenDaysAgo, lt: startOfDay }
            },
            include: {
                vehicle: true,
                leader: true,
                teammate: true
            }
        });

        const pairAffinities: Record<string, number> = {};
        const vehicleAffinities: Record<string, number> = {};
        const roleAffinities: Record<string, { leader: number, teammate: number }> = {};

        historyAssignments.forEach(a => {
            if (a.leaderId) {
                if (!roleAffinities[a.leaderId]) roleAffinities[a.leaderId] = { leader: 0, teammate: 0 };
                roleAffinities[a.leaderId].leader++;
            }
            if (a.teammateId) {
                if (!roleAffinities[a.teammateId]) roleAffinities[a.teammateId] = { leader: 0, teammate: 0 };
                roleAffinities[a.teammateId].teammate++;
            }

            if (a.leaderId && a.teammateId) {
                const p1 = a.leader?.lastName || a.leader?.firstName;
                const p2 = a.teammate?.lastName || a.teammate?.firstName;
                const pairKey = `[${p1} / ${p2}]`;
                pairAffinities[pairKey] = (pairAffinities[pairKey] || 0) + 1;

                if (a.vehicle) {
                    const vehKey = `${pairKey} sur [${a.vehicle.plateNumber}]`;
                    vehicleAffinities[vehKey] = (vehicleAffinities[vehKey] || 0) + 1;
                }
            }
        });

        const strongPairs = Object.entries(pairAffinities).filter(([_, count]) => count >= 2).map(([k, c]) => `${k} : affecté(s) ensemble ${c} fois.`);
        const strongVehicles = Object.entries(vehicleAffinities).filter(([_, count]) => count >= 2).map(([k, c]) => `${k} : affecté(s) sur ce véhicule ${c} fois.`);
        
        const stringifiedRoles = availableUsers.map(u => {
            const hist = roleAffinities[u.id];
            if (!hist) return `${u.lastName} ${u.firstName} : Pas d'historique.`;
            const total = hist.leader + hist.teammate;
            if (total === 0) return `${u.lastName} ${u.firstName} : Pas d'historique.`;
            const isMostlyLeader = (hist.leader / total) >= 0.5;
            return `${u.lastName} ${u.firstName} : Habituellement ${isMostlyLeader ? 'Leader (Responsable)' : 'Co-équipier'} (${hist.leader}x Leader, ${hist.teammate}x Co-équipier).`;
        });

        // 4. Constitution du Prompt Contextuel
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro", generationConfig: { responseMimeType: "application/json" } });

        const prompt = `
Tu es "Jarvis", l'assistant régulateur I.A. principal de VDF Ambulance. 
Ta mission est de constituer des équipages optimaux d'ambulances pour le shift de ${shift} de la journée du ${format(startOfDay, "dd/MM/yyyy")}.

RÈGLES STRICTES DE SÉCURITÉ ET DE LOGIQUE MÉTIER :
1. Un équipage est constitué d'EXACTEMENT 2 personnes : 1 Responsable (leaderId) et 1 Co-équipier (teammateId).
2. Le Responsable de bord DOIT de préférence avoir de l'expérience (isTeamLeader: true) ou le diplôme "DEA" ou tout diplôme chef.
3. Remplis le maximum de véhicules dans l'ordre avec le personnel disponible.
4. N'invente AUCUN ID. Utilise STRICTEMENT les ids de véhicules et d'employés fournis.

DONNÉES D'APPRENTISSAGE (HISTORIQUE DES 14 DERNIERS JOURS) :
Habitudes de Binômes (Priorité Haute) :
${strongPairs.length > 0 ? strongPairs.join('\n') : "Aucune habitude."}

Habitudes de Véhicules (Priorité Moyenne) :
${strongVehicles.length > 0 ? strongVehicles.join('\n') : "Aucune habitude."}

Habitudes de Rôles pour les employés disponibles aujourd'hui :
${stringifiedRoles.join('\n')}

NOUVELLES RÈGLES STRICTES DE MACHINE LEARNING :
5. Tu dois prioriser formellement la reconstitution des Binômes exacts listés dans les "Habitudes de Binômes".
6. Tu dois assigner ces binômes habituels sur les mêmes véhicules qu'habituellement (Habitudes de Véhicules).
7. Rôle : Respecte strictement l'habitude de "Leader" ou "Co-équipier" de l'employé décrit dans l'historique ! Si l'employé est "Habituellement Leader", mets-le dans le champ "leaderId".
8. SHIFT PROTÉGÉ : L'utilisateur demande une régulation pour la vacation : ${shift}. Vérifie si les employés préfèrent le Jour ou la Nuit (champ shift). Ne mets pas un employé "NUIT" sur la vacation "JOUR" si tu peux l'éviter.

DONNÉES D'ENTRÉE :
Véhicules disponibles :
${JSON.stringify(availableVehicles.map(v => ({ id: v.id, plaque: v.plateNumber, marque: v.brand })), null, 2)}

Employés disponibles :
${JSON.stringify(availableUsers.map(u => ({ id: u.id, nom: u.lastName, prenom: u.firstName, estChef: u.isTeamLeader, diplome: u.diploma, preferenceShift: u.shift })), null, 2)}

FORMAT DE SORTIE (JSON UNIQUEMENT) :
Renvoie un objet JSON contenant une clé "assignments" qui est un tableau d'objets :
{
    "assignments": [
        { "vehicleId": "id", "leaderId": "id", "teammateId": "id" }
    ]
}
`;

        console.log(`[IA] Appel à Gemini en cours pour le shift ${shift} avec ${historyAssignments.length} lignes d'historique...`);
        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();
        
        const payload = JSON.parse(textResponse);
        
        if (!payload.assignments || !Array.isArray(payload.assignments)) {
            throw new Error("Format JSON de l'IA invalide.");
        }

        // 5. Sauvegarde en Base de Données
        const assignmentsToCreate = payload.assignments.map((assignment: any) => ({
            vehicleId: assignment.vehicleId,
            leaderId: assignment.leaderId,
            teammateId: assignment.teammateId,
            date: startOfDay,
            startTime: shift === 'JOUR' ? "05:30" : "19:30",
            endTime: shift === 'JOUR' ? "19:00" : "07:00",
            status: 'PENDING',
            leaderValidated: false,
            teammateValidated: false,
            isAiGenerated: true
        }));

        const createCount = await prisma.planningAssignment.createMany({
            data: assignmentsToCreate,
            skipDuplicates: true
        });

        revalidatePath('/dashboard/rh/regulation');
        revalidatePath('/dashboard/salarie/regulation');
        
        return { success: true, count: createCount.count };
    } catch (e: any) {
        console.error("Erreur Generative IA:", e);
        return { error: e.message || "Erreur inconnue de l'IA." };
    }
}

export async function removeAIAssignments(dateStr: string, shift: 'JOUR' | 'NUIT' = 'JOUR') {
    try {
        const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // RÈGLE DE SÉCURITÉ : Interdit de supprimer la veille et avant. 
        if (targetDate < today) {
            return { error: "Vous ne pouvez pas supprimer les affectations du passé." };
        }

        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

        const deleted = await prisma.planningAssignment.deleteMany({
            where: {
                date: { gte: startOfDay, lte: endOfDay },
                startTime: shift === 'JOUR' ? { lt: "19:30" } : { gte: "19:30" },
                isAiGenerated: true,
                status: 'PENDING'
            }
        });

        revalidatePath('/dashboard/rh/regulation');
        revalidatePath('/dashboard/salarie/regulation');

        return { success: true, count: deleted.count };
    } catch (e: any) {
        console.error("Erreur annulation IA:", e);
        return { error: e.message || "Erreur lors du nettoyage de l'IA." };
    }
}
