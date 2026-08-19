/**
 * Sauvegarde manuelle, utile avant une migration ou pour vérifier le format du
 * dump sans attendre le cron.
 *
 *   npm run backup
 */
import { createBackup } from '../src/server/backup';
import { prisma } from '../src/lib/prisma';

void createBackup().finally(() => prisma.$disconnect());
