import { seedFromString } from '@/games/push-your-luck/rng';

/**
 * Clé du jour au fuseau de Paris, format YYYY-MM-DD.
 *
 * Le fuseau est figé volontairement : sans lui, un joueur au Québec et un
 * joueur à Paris obtiendraient deux parties « du jour » différentes et le
 * classement quotidien ne voudrait plus rien dire. `fr-CA` est le raccourci
 * le plus court vers un format ISO.
 */
export function dayKey(date: Date = new Date()): string {
    return new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

export function dailySeed(key: string = dayKey()): number {
    return seedFromString(`push-your-luck:${key}`);
}

export function formatDayKey(key: string, locale = 'fr-FR'): string {
    const [y, m, d] = key.split('-').map(Number);
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(Date.UTC(y, m - 1, d)));
}

/** Millisecondes restantes avant la prochaine partie du jour (minuit à Paris). */
export function msUntilNextDay(now: Date = new Date()): number {
    const parisNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const next = new Date(parisNow);
    next.setHours(24, 0, 0, 0);
    return next.getTime() - parisNow.getTime();
}
