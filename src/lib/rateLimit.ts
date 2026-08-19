/**
 * Limitation de débit en mémoire, par adresse IP.
 *
 * Sans elle, l'audit a montré qu'on pouvait faire accepter vingt scores
 * valides en 439 ms depuis une seule machine : il suffit de générer autant
 * d'identifiants de navigateur que voulu. Ce n'est pas de la triche sur un
 * score, c'est la confiscation du classement entier.
 *
 * Le compteur vit dans le processus, sans Redis : l'application tourne en une
 * seule instance (voir le cron dans instrumentation.ts). Le jour où elle
 * passera à plusieurs, il faudra un compteur partagé — sinon chaque instance
 * autorisera le quota complet.
 */
export interface RateLimitResult {
    allowed: boolean;
    /** Secondes à attendre avant la prochaine tentative, si refusée. */
    retryAfter: number;
    remaining: number;
}

interface Window {
    hits: number[];
}

/**
 * Nombre maximal d'entrées suivies. Au-delà, la plus ancienne est évincée :
 * sans ce plafond, un attaquant qui fait tourner ses adresses ferait grossir
 * la table indéfiniment — la protection deviendrait la fuite.
 */
const MAX_TRACKED = 10_000;

export class RateLimiter {
    private readonly windows = new Map<string, Window>();

    constructor(
        private readonly limit: number,
        private readonly windowMs: number,
    ) {}

    check(key: string, now: number = Date.now()): RateLimitResult {
        const cutoff = now - this.windowMs;
        const window = this.windows.get(key) ?? { hits: [] };

        window.hits = window.hits.filter((time) => time > cutoff);

        if (window.hits.length >= this.limit) {
            const oldest = window.hits[0];
            return {
                allowed: false,
                retryAfter: Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000)),
                remaining: 0,
            };
        }

        window.hits.push(now);

        // Réinsertion systématique : Map conserve l'ordre d'insertion, donc
        // supprimer puis remettre place l'entrée en fin de file et fait de
        // l'éviction un vrai « moins récemment utilisé ».
        this.windows.delete(key);
        this.windows.set(key, window);

        if (this.windows.size > MAX_TRACKED) {
            const oldestKey = this.windows.keys().next().value;
            if (oldestKey !== undefined) this.windows.delete(oldestKey);
        }

        return { allowed: true, retryAfter: 0, remaining: this.limit - window.hits.length };
    }

    /** Uniquement pour les tests : repart d'une table vide. */
    reset(): void {
        this.windows.clear();
    }

    get tracked(): number {
        return this.windows.size;
    }
}

/**
 * Identifie l'appelant derrière un proxy inverse.
 *
 * `x-forwarded-for` est une liste ; la PREMIÈRE valeur est le client d'origine.
 * Elle est falsifiable par l'appelant, mais le proxy de production la réécrit —
 * et sans proxy, la connexion est directe et l'en-tête absent.
 */
export function clientKey(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return request.headers.get('x-real-ip') ?? 'inconnu';
}
