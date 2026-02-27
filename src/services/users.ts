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
                role: true,
                createdAt: true,
                firstName: true,
                lastName: true,
                phone: true,
                birthDate: true,
                isActive: true,
                deletionReason: true,
            }
        })
        return users
    } catch (error) {
        console.error("Error fetching all users:", error)
        return []
    }
}
