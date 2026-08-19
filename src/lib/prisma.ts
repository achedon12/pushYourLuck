import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@/generated/prisma/client';

// Prisma 7 impose un adaptateur de driver, et celui-ci lit DATABASE_URL à la
// CONSTRUCTION (et non à la requête comme le moteur Rust de Prisma 6) : d'où
// le `dotenv/config` en tête, avant toute évaluation de module.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter: new PrismaMariaDb(process.env.DATABASE_URL as string),
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
