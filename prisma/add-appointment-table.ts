import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addAppointmentRequestTable() {
    console.log("🚀 Début de la mise à jour de la base de données...")

    try {
        // Create the enum if it doesn't exist (Prisma maps enums to tables in PostgreSQL, but here we used `String` in the schema for `appointmentMode`!)
        // Wait, looking at schema.prisma:
        // appointmentMode String?
        // So no enum needed for appointmentMode!

        // 1. Create the table
        console.log("Création de la table AppointmentRequest...")
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "AppointmentRequest" (
                "id" TEXT NOT NULL,
                "userId" TEXT NOT NULL,
                "reason" TEXT NOT NULL,
                "description" TEXT,
                "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
                "appointmentDate" TIMESTAMP(3),
                "appointmentMode" TEXT,
                "adminComment" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,

                CONSTRAINT "AppointmentRequest_pkey" PRIMARY KEY ("id")
            );
        `)

        console.log("Table créée avec succès (ou déjà existante).")

        // 2. Add Foreign Key relationship
        console.log("Ajout de la contrainte de clé étrangère...")
        await prisma.$executeRawUnsafe(`
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'AppointmentRequest_userId_fkey'
              ) THEN
                ALTER TABLE "AppointmentRequest" 
                ADD CONSTRAINT "AppointmentRequest_userId_fkey" 
                FOREIGN KEY ("userId") REFERENCES "User"("id") 
                ON DELETE CASCADE ON UPDATE CASCADE;
              END IF;
            END;
            $$;
        `)
        console.log("Clé étrangère ajoutée avec succès (ou déjà existante).")

        console.log("✅ Mise à jour terminée sans toucher aux tables n8n !")
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour de la base de données :", error)
    } finally {
        await prisma.$disconnect()
    }
}

addAppointmentRequestTable()
