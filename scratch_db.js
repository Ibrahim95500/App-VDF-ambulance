const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const assignments = await prisma.planningAssignment.findMany({
        where: {
             vehicleId: { not: undefined }
        },
        include: {
            vehicle: true,
            leader: true,
            teammate: true
        }
    });
    console.log(JSON.stringify(assignments.filter(a => a.vehicle.plateNumber === 'HE-042-WP'), null, 2));
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
