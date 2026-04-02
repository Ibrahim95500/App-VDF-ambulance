import { prisma } from "./src/lib/prisma";

async function main() {
    const requests = await prisma.appointmentRequest.findMany({
        where: { type: { notIn: ["RENDEZ_VOUS", "CONVOCATION"] } }
    });
    for (const req of requests) {
        let reasonFix = req.reason;
        if (req.reason === "Via Bot") {
            // we try to extract from type if possible, or just user text.
            const humanTypeMap: Record<string, string> = {
                'ENTRETIEN_ANNUEL': 'Entretien Annuel',
                'AUGMENTATION_SALAIRE': 'Augmentation / Salaire',
                'CONFLIT_MEDIATION': 'Conflit / Médiation',
                'DEMISSION': 'Fin de contrat / Démission'
            };
            reasonFix = humanTypeMap[req.type as string] || "Question administrative";
        }
        await prisma.appointmentRequest.update({
            where: { id: req.id },
            data: { 
                type: "RENDEZ_VOUS",
                reason: reasonFix
            }
        });
        console.log(`Fixed RDV ${req.id}`);
    }
}
main();
