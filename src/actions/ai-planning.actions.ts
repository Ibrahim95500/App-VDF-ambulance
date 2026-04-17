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
            where: { isActive: true },
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
            select: { id: true, firstName: true, lastName: true, diploma: true, isTeamLeader: true, isRegulateur: true, roles: true }
        });

        // On enlève du panier ceux qui sont déjà affectés manuellement
        const availableUsers = allUsers.filter(u => !assignedUserIds.has(u.id));

        if (availableVehicles.length === 0) return { error: "Tous les véhicules sont déjà assignés." };
        if (availableUsers.length < 2) return { error: "Pas assez d'employés disponibles pour faire des binômes." };

        // 4. Constitution du Prompt Contextuel
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro", generationConfig: { responseMimeType: "application/json" } });

        const prompt = `
Tu es "Jarvis", l'assistant régulateur I.A. principal de VDF Ambulance. 
Ta mission est de constituer des équipages optimaux d'ambulances pour la journée du ${format(startOfDay, "dd/MM/yyyy")}.

RÈGLES STRICTES DE SÉCURITÉ ET DE LOGIQUE MÉTIER :
1. Un équipage est constitué d'EXACTEMENT 2 personnes : 1 Responsable (leaderId) et 1 Co-équipier (teammateId).
2. Le Responsable de bord DOIT de préférence avoir de l'expérience (isTeamLeader: true) ou le diplôme "DEA" ou tout diplôme chef.
3. Remplis le maximum de véhicules dans l'ordre avec le personnel disponible.
4. N'invente AUCUN ID. Utilise STRICTEMENT les ids de véhicules et d'employés fournis.

DONNÉES D'ENTRÉE :
Véhicules disponibles :
${JSON.stringify(availableVehicles.map(v => ({ id: v.id, plaque: v.plateNumber, marque: v.brand })), null, 2)}

Employés disponibles :
${JSON.stringify(availableUsers.map(u => ({ id: u.id, nom: u.lastName, prenom: u.firstName, estChef: u.isTeamLeader, diplome: u.diploma })), null, 2)}

FORMAT DE SORTIE (JSON UNIQUEMENT) :
Renvoie un objet JSON contenant une clé "assignments" qui est un tableau d'objets :
{
    "assignments": [
        { "vehicleId": "id", "leaderId": "id", "teammateId": "id" }
    ]
}
`;

        console.log("[IA] Appel à Gemini en cours...");
        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();
        
        const payload = JSON.parse(textResponse);
        
        if (!payload.assignments || !Array.isArray(payload.assignments)) {
            throw new Error("Format JSON de l'IA invalide.");
        }

        // 5. Sauvegarde en Base de Données (au statut PENDING => en attente de validation)
        const assignmentsToCreate = payload.assignments.map((assignment: any) => ({
            vehicleId: assignment.vehicleId,
            leaderId: assignment.leaderId,
            teammateId: assignment.teammateId,
            date: startOfDay,
            startTime: shift === 'JOUR' ? "05:30" : "19:30",
            endTime: shift === 'JOUR' ? "19:00" : "07:00",
            status: 'PENDING',
            leaderValidated: false,
            teammateValidated: false
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
