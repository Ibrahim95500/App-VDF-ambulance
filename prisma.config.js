try {
    require('dotenv/config');
} catch (e) {
    // Ignore in production where dotenv might not be installed
}

/** @type {import('@prisma/config').PrismaConfig} */
module.exports = {
    datasource: {
        url: process.env.DATABASE_URL,
    },
    migrations: {
        seed: './node_modules/.bin/tsx prisma/seed.ts',
    },
};
