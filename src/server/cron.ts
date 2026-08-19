import cron from 'node-cron';
import { createBackup } from './backup';
import { purgeOldScores } from './retention';

/**
 * Tâches planifiées, démarrées par `instrumentation.ts` à l'amorçage du serveur.
 *
 * Elles vivent dans le processus Next, sans conteneur supplémentaire. Deux
 * précautions en découlent :
 *   - désactivées en développement, sinon chaque `npm run dev` écrit des dumps ;
 *   - à revoir le jour où l'application tournera en plusieurs instances (comme
 *     le blue/green du loup-garou) : chaque instance exécuterait le même travail.
 */
export function initializeCron(): void {
    if (process.env.NODE_ENV !== 'production') {
        console.log('[cron] désactivé hors production');
        return;
    }

    // 03h15 : après le changement de paquet quotidien (minuit) et hors des
    // heures de jeu, pour que la sauvegarde capture une journée complète.
    cron.schedule('15 3 * * *', async () => {
        try {
            await createBackup();
            await purgeOldScores();
        } catch (error) {
            console.error('[cron] échec de la tâche quotidienne', error);
        }
    }, { timezone: 'Europe/Paris' });

    console.log('[cron] sauvegarde quotidienne planifiée à 03h15 (Europe/Paris)');
}
