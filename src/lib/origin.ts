import { site } from '@/lib/site';

/**
 * Vérifie qu'une écriture provient bien d'une page du site.
 *
 * CE QUE ÇA PROTÈGE : un autre site qui ferait poster ton visiteur à son insu
 * depuis son navigateur. `Origin` est posé par le navigateur lui-même sur
 * toute requête POST, et une page n'a aucun moyen de le falsifier — c'est
 * précisément ce qui en fait une défense contre la falsification de requête
 * inter-site, là où le projet n'a aucun jeton CSRF.
 *
 * CE QUE ÇA NE PROTÈGE PAS : un appel fabriqué hors navigateur. Un
 * `curl -H "Origin: https://pushyourluck.net"` franchit ce contrôle sans
 * effort ; un en-tête n'est pas une preuve d'identité, et aucune vérification
 * d'origine ne peut l'être. Contre une partie forgée, la défense reste le
 * rejeu côté serveur (`replay.ts`) ; contre l'inondation, la limitation de
 * débit (`rateLimit.ts`).
 */

/** `schéma://hôte[:port]` d'une URL, ou `null` si elle est inexploitable. */
function originOf(url: string): string | null {
    try {
        return new URL(url).origin;
    } catch {
        return null;
    }
}

/**
 * L'application tourne en local sur un port qui change selon le contexte —
 * 3001 en développement, 3002 pour les tests, autre chose au besoin. Lister
 * `NEXT_PUBLIC_SITE_URL` ne suffirait donc pas : en développement, elle
 * annonce le domaine de production alors que le navigateur envoie
 * `http://localhost:3001`.
 */
function isLocal(origin: string): boolean {
    try {
        const { hostname } = new URL(origin);
        return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
    } catch {
        return false;
    }
}

export function isTrustedOrigin(request: Request): boolean {
    const origin = request.headers.get('origin');
    // Un POST sans `Origin` ne vient pas d'un navigateur : tous en posent un,
    // même pour une requête de même origine. On refuse plutôt que de laisser
    // passer, quitte à ce qu'un client maison doive ajouter l'en-tête.
    if (!origin) return false;

    if (origin === originOf(site.url)) return true;

    // Jamais en production : là, seul le domaine du site est accepté.
    return process.env.NODE_ENV !== 'production' && isLocal(origin);
}
