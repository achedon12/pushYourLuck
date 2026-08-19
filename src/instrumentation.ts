/**
 * Point d'entrée d'initialisation du serveur Next : `register` est appelé une
 * fois au démarrage, avant la première requête.
 *
 * Le test sur le runtime n'est pas décoratif : ce fichier est aussi évalué pour
 * l'exécution en périphérie, où `node-cron` et le système de fichiers
 * n'existent pas.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME !== 'nodejs') return;

    const { initializeCron } = await import('./server/cron');
    initializeCron();
}
