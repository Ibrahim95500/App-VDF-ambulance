const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
});

async function seed() {
    try {
        await client.connect();
        console.log('Connecté à PostgreSQL pour le seed direct...');

        // Hashes générés pour les accès réels
        const IBRAHIM_HASH = "$2b$10$7DCyWepFWX03josowcWrluAgDNPxFnsNFCyfUc5v4m6WpX0N1UtEG"; // Nanou2020@
        const HAMID_HASH = "$2b$10$vXHbmkg1KpmjjTefEvak..tUAVwBLKoBFms37fey8M7FvqZb7q4Y2"; // Hamidou95140@
        const REZAN_HASH = "$2a$10$Pvk.5vGjFhYFv.M98U5pbeV.T3S0Y8/1Ff5fT0Y8/1Ff5fT0Y8/1F"; // password123
        const TEST_HASH = "$2a$10$Pvk.5vGjFhYFv.M98U5pbeV.T3S0Y8/1Ff5fT0Y8/1Ff5fT0Y8/1F"; // password123

        // 1. Mise à jour des Utilisateurs Principaux (Rezan devient REGULATEUR)
        console.log('Peuplement des accès prioritaires...');
        const mainUsers = [
            ['ibrahim-id', 'ibrahim.nifa01@gmail.com', 'Ibrahim NIFA', 'Ibrahim', 'NIFA', 'SALARIE', false, IBRAHIM_HASH],
            ['hamid-id', 'ambulancemark@gmail.com', 'Hamid CHEIKH', 'Hamid', 'CHEIKH', 'RH', false, HAMID_HASH],
            ['rezan-id', 'rezan.selva@gmail.com', 'Rezan SELVA', 'Rezan', 'SELVA', 'SALARIE', true, REZAN_HASH], // REZAN = REGULATEUR
        ];

        for (const [id, email, name, fName, lName, role, isReg, password] of mainUsers) {
            await client.query(`
        INSERT INTO "User" (id, email, name, password, role, "firstName", "lastName", "isRegulateur", "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET 
            role = EXCLUDED.role, 
            password = EXCLUDED.password,
            name = EXCLUDED.name,
            "isRegulateur" = EXCLUDED."isRegulateur",
            "firstName" = EXCLUDED."firstName",
            "lastName" = EXCLUDED."lastName";
      `, [id, email, name, password, role, fName, lName, isReg]);
        }

        // 2. Véhicules (Mise à jour selon la nouvelle liste PJ)
        console.log('Peuplement des véhicules (Nouvelle liste)...');
        const vehicles = [
            // Anciens
            ['EP-268-EJ', 'MARK'],
            ['FB-913-YS', 'MARK'],
            ['FH-181-FX', 'MARK'],
            ['FK-433-KS', 'VDF'],
            ['FK-477-KR', 'VDF'],
            ['FK-840-CN', 'VDF'],
            // Nouveaux PJ
            ['HE-042-WP', 'MARK'],
            ['FX-542-YZ', 'MARK'],
            ['GM-657-RB', 'MARK'],
            ['GR-638-TJ', 'MARK'],
            ['HC-130-TB', 'MARK'],
            ['FC-223-MS', 'MARK'],
            ['VSL-GENERIC', 'VDF'], // Pour le VSL
        ];

        for (const [plate, cat] of vehicles) {
            await client.query(`
        INSERT INTO "Vehicle" (id, "plateNumber", category, "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())
        ON CONFLICT ("plateNumber") DO UPDATE SET category = EXCLUDED.category;
      `, [plate, cat]);
        }

        console.log('--- SEED DIRECT V2 TERMINÉ AVEC SUCCÈS ---');
    } catch (err) {
        console.error('Erreur lors du seed direct:', err);
    } finally {
        await client.end();
    }
}

seed();
