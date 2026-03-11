require('dotenv').config();
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
        const REZAN_HASH = "$2b$10$n7zLMFwxji2QFAWkaYmB9OE5cKcVooN1gUuvjcJ8txxloK85iGaXa"; // password123 (Garanti)
        const TEST_HASH = "$2b$10$n7zLMFwxji2QFAWkaYmB9OE5cKcVooN1gUuvjcJ8txxloK85iGaXa"; // password123

        // 1. Mise à jour des Utilisateurs Principaux et Employés Réels
        console.log('Peuplement des accès prioritaires et employés réels...');

        // Structure: id, email, name, fName, lName, roles (Array of Enum), isReg, password, structure, diploma, shift, preference, isTeamLeader
        const mainUsers = [
            // Comptes Administratifs
            ['ibrahim-id', 'ibrahim.nifa01@gmail.com', 'Ibrahim NIFA', 'Ibrahim', 'NIFA', '{"SALARIE"}', false, IBRAHIM_HASH, 'LES_2', 'DEA', 'JOUR', 'NORMAL', false],
            ['hamid-id', 'ambulancemark@gmail.com', 'Hamid CHEIKH', 'Hamid', 'CHEIKH', '{"SALARIE", "RH"}', false, HAMID_HASH, null, null, null, null, false],
            ['rezan-id', 'rezan.selva@gmail.com', 'Rezan SELVA', 'Rezan', 'SELVA', '{"SALARIE", "REGULATEUR", "ADMIN"}', true, REZAN_HASH, 'MARK', 'DEA', 'JOUR', 'NORMAL', false],

            // Employés Réels (MARK)
            ['dahm-id', 'dahm@vdf.fr', 'Dahm', 'Dahm', '', '{"SALARIE"}', false, TEST_HASH, 'MARK', 'AUXILIAIRE', 'JOUR', 'MATIN', true],
            ['ben-id', 'ben@vdf.fr', 'Ben', 'Ben', '', '{"SALARIE"}', false, TEST_HASH, 'MARK', 'AUXILIAIRE', 'NUIT', 'NUIT', false],
            ['abdel-id', 'abdel@vdf.fr', 'Abdel', 'Abdel', '', '{"SALARIE"}', false, TEST_HASH, 'MARK', 'DEA', 'JOUR', 'NORMAL', true],

            // Employés Réels (VDF)
            ['farhan-id', 'farhan@vdf.fr', 'Farhan', 'Farhan', '', '{"SALARIE"}', false, TEST_HASH, 'VDF', 'AUXILIAIRE', 'JOUR', 'NORMAL', true],
            ['yannick-id', 'yannick@vdf.fr', 'Yannick', 'Yannick', '', '{"SALARIE"}', false, TEST_HASH, 'VDF', 'AUXILIAIRE', 'JOUR', 'NORMAL', true],
            ['chrisod-id', 'chrisod@vdf.fr', 'Chris OD', 'Chris', 'OD', '{"SALARIE"}', false, TEST_HASH, 'VDF', 'DEA', 'JOUR', 'NORMAL', true],
        ];

        for (const [id, email, name, fName, lName, roles, isReg, password, struc, dipl, shif, pref, isTL] of mainUsers) {
            await client.query(`
        INSERT INTO "User" (id, email, name, password, roles, "firstName", "lastName", "isRegulateur", "isActive", structure, diploma, shift, preference, "isTeamLeader", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5::"Role"[], $6, $7, $8, true, $9::"Structure", $10::"Diploma", $11::"Shift", $12::"Preference", $13, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET 
            roles = EXCLUDED.roles, 
            password = EXCLUDED.password,
            name = EXCLUDED.name,
            "isRegulateur" = EXCLUDED."isRegulateur",
            "firstName" = EXCLUDED."firstName",
            "lastName" = EXCLUDED."lastName",
            structure = EXCLUDED.structure,
            diploma = EXCLUDED.diploma,
            shift = EXCLUDED.shift,
            preference = EXCLUDED.preference,
            "isTeamLeader" = EXCLUDED."isTeamLeader";
      `, [id, email, name, password, roles, fName, lName, isReg, struc, dipl, shif, pref, isTL]);
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
            ['VSL-GENERIC', 'MARK'], // VSL traité comme véhicule MARK
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
