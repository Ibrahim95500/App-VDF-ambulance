const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function run() {
    const r = await prisma.planningAssignment.findMany();
    console.log("Found assignments:", r.length);
    if(r.length > 0) {
        console.log("First assignment date:", r[0].date);
        console.log("Vehicle ID:", r[0].vehicleId);
        console.log("Start time:", r[0].startTime);
    }
}
run();
