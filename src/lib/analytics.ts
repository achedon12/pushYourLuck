/**
 * Mesure d'audience Matomo, auto-hébergée et SANS COOKIE.
 *
 * Le choix du mode sans cookie n'est pas cosmétique : c'est ce qui permet de se
 * passer de bandeau de consentement. La CNIL exempte la mesure d'audience à des
 * conditions strictes — pas de cookie (ou uniquement des cookies exemptés),
 * finalité limitée à la mesure, pas de recoupement entre sites, pas de
 * transmission à des tiers, IP anonymisée. `disableCookies` + une instance
 * auto-hébergée cochent ces cases ; la configuration côté Matomo (anonymisation
 * de l'IP) doit suivre, sinon l'exemption tombe.
 *
 * Sans les variables d'environnement, rien n'est chargé : le site fonctionne
 * identiquement, il n'est simplement pas mesuré.
 */
export const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL ?? '';
export const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID ?? '';

/**
 * La mesure est coupée hors production, même variables renseignées : sans ce
 * garde-fou, chaque `npm run dev` enverrait des vues à l'instance réelle et
 * fausserait les chiffres avec du trafic de développement.
 */
export const isAnalyticsConfigured = () =>
    MATOMO_URL !== '' && MATOMO_SITE_ID !== '' && process.env.NODE_ENV === 'production';

/** Normalise l'URL de l'instance en une base terminée par un `/`. */
export function trackerBase(url: string = MATOMO_URL): string {
    if (url === '') return '';
    return url.endsWith('/') ? url : `${url}/`;
}

type Command = (string | number | boolean)[];

interface MatomoWindow extends Window {
    _paq?: Command[];
}

function push(command: Command): void {
    if (typeof window === 'undefined') return;
    const w = window as MatomoWindow;
    // La file existe avant le script : les commandes émises pendant le
    // chargement sont rejouées à l'arrivée de matomo.js, rien n'est perdu.
    w._paq = w._paq ?? [];
    w._paq.push(command);
}

export function trackPageView(url: string, title?: string): void {
    if (!isAnalyticsConfigured()) return;
    push(['setCustomUrl', url]);
    if (title) push(['setDocumentTitle', title]);
    push(['trackPageView']);
}

/**
 * Événement de jeu. Aucun paramètre ne doit contenir de donnée personnelle :
 * on suit des étapes et des ordres de grandeur, pas des joueurs.
 */
export function trackEvent(category: string, action: string, name?: string, value?: number): void {
    if (!isAnalyticsConfigured()) return;
    const command: Command = ['trackEvent', category, action];
    if (name !== undefined) command.push(name);
    if (value !== undefined) command.push(value);
    push(command);
}

/**
 * Range un score dans un palier plutôt que de le transmettre tel quel : un
 * score exact associé à une heure précise est un identifiant, un palier non.
 */
export function scoreBucket(score: number): string {
    if (score === 0) return '0';
    if (score < 50) return '1-49';
    if (score < 100) return '50-99';
    if (score < 200) return '100-199';
    if (score < 400) return '200-399';
    return '400+';
}
