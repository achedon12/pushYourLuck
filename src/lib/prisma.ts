import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@/generated/prisma/client';

/**
 * Client Prisma partagé, construit à la PREMIÈRE UTILISATION et non à l'import.
 *
 * Prisma 7 impose un adaptateur de driver, et celui-ci lit `DATABASE_URL` à la
 * construction — là où le moteur Rust de Prisma 6 le lisait à la requête.
 * Construire à l'import rendait donc `next build` dépendant d'identifiants de
 * base de données : la compilation échouait avec « Failed to collect page data
 * for /api/health » dès que le .env était absent, ce qui est exactement le cas
 * dans une image Docker bien faite.
 *
 * Le mandataire diffère la création jusqu'au premier accès. La compilation ne
 * touche plus à la base, et une configuration manquante se signale à la
 * première requête, avec un message explicite.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error(
            'DATABASE_URL est absent : impossible de joindre la base. ' +
            'Copie .env.example en .env, ou renseigne la variable dans l’environnement.',
        );
    }

    return new PrismaClient({
        adapter: new PrismaMariaDb(url),
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
}

export const prisma = new Proxy({} as PrismaClient, {
    get(_target, property, receiver) {
        if (!globalForPrisma.prisma) globalForPrisma.prisma = createClient();
        return Reflect.get(globalForPrisma.prisma, property, receiver);
    },
});
