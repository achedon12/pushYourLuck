import { prisma } from '@/lib/prisma';
import { dayKey } from '@/lib/daily';

/**
 * Applique la durée de conservation annoncée dans la politique de
 * confidentialité : un an pour les scores quotidiens.
 *
 * Ce n'est pas une optimisation de place — c'est la tenue d'un engagement écrit
 * sur la page « confidentialité ». Si tu changes cette durée, change-la aussi
 * dans les deux dictionnaires.
 */
export async function purgeOldScores(): Promise<number> {
    const limit = new Date();
    limit.setUTCFullYear(limit.getUTCFullYear() - 1);
    const cutoff = dayKey(limit);

    const { count } = await prisma.score.deleteMany({
        where: { mode: 'daily', dayKey: { lt: cutoff } },
    });

    if (count > 0) console.log(`[retention] ${count} scores antérieurs au ${cutoff} supprimés`);
    return count;
}
