import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const assignments = await prisma.planningAssignment.findMany({
        where: { date: { gte: new Date("2026-03-24T00:00:00.000Z") } },
        include: { leader: true, teammate: true, vehicle: true },
        orderBy: { date: 'desc' }
    })
    console.log(JSON.stringify(assignments.map(a => ({
        id: a.id,
        date: a.date,
        v: a.vehicle?.plateNumber,
        leader: Object.values(a.leader || Object({})).join(' '),
        start: a.startTime,
        end: a.endTime
    })), null, 2))
}
main().catch(console.error).finally(() => prisma.$disconnect())
