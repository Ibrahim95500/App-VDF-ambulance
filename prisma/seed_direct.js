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

        const STATIC_HASH = "$2a$10$Pvk.5vGjFhYFv.M98U5pbeV.T3S0Y8/1Ff5fT0Y8/1Ff5fT0Y8/1F"; // password123

        // 1. Mise à jour des Administrateurs RH
        console.log('Peuplement des administrateurs...');
        const admins = [
            ['rezan-id', 'rezan.selva@gmail.com', 'Rezan SELVA', 'Rezan', 'SELVA'],
            ['ibrahim-id', 'ibrahim.nifa01@gmail.com', 'Ibrahim NIFA', 'Ibrahim', 'NIFA'],
            ['hamid-id', 'hamidc@vdf.fr', 'Hamid CHEIKH', 'Hamid', 'CHEIKH'],
        ];

        for (const [id, email, name, fName, lName] of admins) {
            await client.query(`
        INSERT INTO "User" (id, email, name, role, "firstName", "lastName", "isTeamLeader", "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'RH', $4, $5, true, true, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET role = 'RH', "isTeamLeader" = true;
      `, [id, email, name, fName, lName]);
        }

        // 2. Véhicules
        console.log('Peuplement des véhicules...');
        const vehicles = [
            ['EP-268-EJ', 'MARK'],
            ['FB-913-YS', 'MARK'],
            ['FH-181-FX', 'MARK'],
            ['FK-433-KS', 'VDF'],
            ['FK-477-KR', 'VDF'],
            ['FK-840-CN', 'VDF'],
        ];

        for (const [plate, cat] of vehicles) {
            await client.query(`
        INSERT INTO "Vehicle" (id, "plateNumber", category, "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())
        ON CONFLICT ("plateNumber") DO NOTHING;
      `, [plate, cat]);
        }

        // 3. Salariés de test
        const testUsers = [
            ['resp.mark@vdf.fr', 'Responsable', 'MARK', 'MARK', 'DEA', 'JOUR', true],
            ['coeq.mark@vdf.fr', 'Coéquipier', 'MARK', 'MARK', 'AUXILIAIRE', 'JOUR', false],
            ['resp.vdf@vdf.fr', 'Responsable', 'VDF', 'VDF', 'DEA', 'NUIT', true],
            ['coeq.vdf@vdf.fr', 'Coéquipier', 'VDF', 'VDF', 'AUXILIAIRE', 'NUIT', false],
            ['resp.les2@vdf.fr', 'Responsable', 'LES2', 'LES_2', 'DEA', 'JOUR_NUIT', true],
            ['coeq.les2@vdf.fr', 'Coéquipier', 'LES2', 'LES_2', 'AUXILIAIRE', 'JOUR_NUIT', false],
        ];

        for (const [email, fName, lName, struct, diplo, shift, leader] of testUsers) {
            await client.query(`
        INSERT INTO "User" (id, email, name, password, role, "firstName", "lastName", structure, diploma, shift, "isTeamLeader", "isActive", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, $1, $2, $3, 'SALARIE', $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING;
      `, [email, `${fName} ${lName}`, STATIC_HASH, fName, lName, struct, diplo, shift, leader]);
        }

        console.log('--- SEED DIRECT TERMINÉ AVEC SUCCÈS ---');
    } catch (err) {
        console.error('Erreur lors du seed direct:', err);
    } finally {
        await client.end();
    }
}

seed();
