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
 * L'ordre des sources n'est pas indifférent, c'est même tout l'intérêt de
 * cette fonction. `x-real-ip` est posé par nginx à partir de l'adresse de la
 * connexion : l'appelant ne peut pas l'imposer, le proxy l'écrase. On le
 * préfère donc à tout le reste.
 *
 * À défaut, on prend la DERNIÈRE valeur de `x-forwarded-for` et non la
 * première. La directive nginx habituelle
 * (`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for`) AJOUTE
 * l'adresse réelle à la fin d'une liste que le client a pu commencer :
 * la première valeur est donc celle de l'appelant, la dernière celle du proxy.
 * Lire la première rendait le quota inopérant — il suffisait de changer
 * l'en-tête à chaque envoi pour repartir d'un compteur neuf, ce qui a été
 * vérifié : 25 envois de suite passaient sans un seul 429.
 */
export function clientKey(request: Request): string {
    const real = request.headers.get('x-real-ip')?.trim();
    if (real) return real;

    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        const hops = forwarded.split(',').map((hop) => hop.trim()).filter(Boolean);
        if (hops.length > 0) return hops[hops.length - 1];
    }

    return 'inconnu';
}
