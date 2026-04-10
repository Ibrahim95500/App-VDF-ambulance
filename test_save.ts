import { prisma } from "./src/lib/prisma";

async function run() {
    const v = await prisma.vehicle.findFirst({ where: { plateNumber: "HC-130-TB" } });
    const user1 = await prisma.user.findFirst({ where: { firstName: "Milhan" } });
    const user2 = await prisma.user.findFirst({ where: { firstName: "Ibrahim" } });
    console.log("Vehicle:", v?.id);
    console.log("Milhan:", user1?.id);
    console.log("Ibrahim:", user2?.id);
}
run();
