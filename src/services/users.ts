import { prisma } from "@/lib/prisma"

export async function getAllUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: {
                name: 'asc'
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                roles: true,
                createdAt: true,
                firstName: true,
                lastName: true,
                phone: true,
                birthDate: true,
                isActive: true,
                deletionReason: true,
                structure: true,
                diploma: true,
                shift: true,
                preference: true,
                isTeamLeader: true,
                isRegulateur: true,
                oubliCount: true,
            }
        })
        return users
    } catch (error) {
        console.error("Error fetching all users:", error)
        return []
    }
}
