import { prisma } from './src/lib/prisma';

async function test() {
    const today = new Date();
    // Simulate what commands.ts does
    const startOfToday = new Date(today.setHours(0,0,0,0));
    const endOfToday = new Date(today.setHours(23,59,59,999));

    // Try finding all
    const all = await prisma.planningAssignment.findMany();
    console.log("ALL DATES:", all.map(a => a.date.toISOString()));
    
    const filtered = await prisma.planningAssignment.findMany({
        where: {
            date: { gte: startOfToday, lte: endOfToday }
        }
    });
    console.log("FILTERED COUNT:", filtered.length);
}
test();
