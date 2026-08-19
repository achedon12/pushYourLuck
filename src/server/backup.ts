import { createWriteStream } from 'node:fs';
import { mkdir, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { prisma } from '@/lib/prisma';

/**
 * Sauvegarde de la base, écrite en SQL puis compressée.
 *
 * Le dump passe par Prisma plutôt que par `mysqldump` — même principe que sur le
 * loup-garou. La raison est pratique : l'image applicative est une alpine sans
 * client MySQL, et ajouter le binaire uniquement pour la sauvegarde ferait
 * dépendre les backups d'un paquet système qu'un jour on oubliera de réinstaller.
 *
 * Restauration :
 *   gunzip -c dump/pushyourluck-....sql.gz | docker exec -i pyl_db mysql -upushyourluck -p pushyourluck
 */
const BACKUP_DIR = path.join(process.cwd(), 'dump');
const MAX_BACKUPS = 7;

/** Échappement MySQL : la barre oblique inverse doit passer en premier. */
export function quote(value: unknown): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
    if (typeof value === 'boolean') return value ? '1' : '0';
    if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;

    const escaped = String(value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\0/g, '\\0');
    return `'${escaped}'`;
}

/** Génère le SQL par paquets pour ne jamais tenir toute la table en mémoire. */
export async function* dumpScores(): AsyncGenerator<string> {
    const CHUNK = 500;

    yield `-- Sauvegarde Push Your Luck — ${new Date().toISOString()}\n`;
    yield 'SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n\n';
    yield '-- Table Score\n';

    let cursor = 0;
    let total = 0;

    for (;;) {
        const rows = await prisma.score.findMany({
            where: { id: { gt: cursor } },
            orderBy: { id: 'asc' },
            take: CHUNK,
        });
        if (rows.length === 0) break;

        const columns = Object.keys(rows[0]);
        const values = rows
            .map((row) => `(${columns.map((c) => quote((row as Record<string, unknown>)[c])).join(', ')})`)
            .join(',\n  ');

        yield `INSERT INTO \`Score\` (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES\n  ${values};\n`;

        cursor = rows[rows.length - 1].id;
        total += rows.length;
    }

    yield `\nSET FOREIGN_KEY_CHECKS = 1;\n-- ${total} lignes\n`;
}

export async function createBackup(): Promise<string> {
    // 0700 sur le dossier, 0600 sur le fichier : un dump contient les pseudos
    // de tous les joueurs, il n'a pas à être lisible par les autres comptes de
    // la machine.
    await mkdir(BACKUP_DIR, { recursive: true, mode: 0o700 });

    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const file = path.join(BACKUP_DIR, `pushyourluck-${stamp}.sql.gz`);

    await pipeline(
        Readable.from(dumpScores()),
        createGzip({ level: 9 }),
        createWriteStream(file, { mode: 0o600 }),
    );
    await pruneBackups();

    console.log(`[backup] ${path.basename(file)}`);
    return file;
}

/** Ne garde que les MAX_BACKUPS sauvegardes les plus récentes. */
async function pruneBackups(): Promise<void> {
    const files = (await readdir(BACKUP_DIR))
        .filter((name) => name.startsWith('pushyourluck-') && name.endsWith('.sql.gz'))
        .sort()
        .reverse();

    for (const stale of files.slice(MAX_BACKUPS)) {
        await unlink(path.join(BACKUP_DIR, stale));
        console.log(`[backup] purge ${stale}`);
    }
}
