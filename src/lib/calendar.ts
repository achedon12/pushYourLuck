export interface DayBest {
    dayKey: string;
    score: number;
    /** Manches encaissées par le joueur qui a signé ce score. */
    rounds: number;
    name: string;
}

export interface MonthGrid {
    year: number;
    month: number;
    daysInMonth: number;
    /** Cases vides à insérer avant le 1er, semaine commençant le lundi. */
    firstWeekday: number;
    /** Clés « YYYY-MM-DD » du mois, dans l'ordre. */
    days: string[];
}

/**
 * Géométrie d'un mois de calendrier.
 *
 * Extrait du composant pour être testable : les bugs de calendrier se logent
 * toujours dans les mois de 31 jours, les février bissextiles et les mois qui
 * commencent un dimanche.
 */
export function buildMonthGrid(month: string): MonthGrid {
    const [year, monthNumber] = month.split('-').map(Number);
    const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

    // getUTCDay() renvoie 0 pour dimanche ; on décale pour une semaine qui
    // commence le lundi, comme en France et au Royaume-Uni.
    const firstWeekday = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;

    const days = Array.from({ length: daysInMonth }, (_, i) =>
        `${year}-${String(monthNumber).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
    );

    return { year, month: monthNumber, daysInMonth, firstWeekday, days };
}

/**
 * Ne garde qu'une ligne par jour : la meilleure.
 *
 * `rows` doit arriver trié par jour puis par score décroissant — c'est la base
 * qui trie, pas cette fonction, pour ne pas rapatrier deux fois le travail.
 */
export function bestPerDay(
    rows: { dayKey: string; score: number; rounds: number; name: string }[],
): DayBest[] {
    const best = new Map<string, DayBest>();

    for (const row of rows) {
        if (best.has(row.dayKey)) continue;
        best.set(row.dayKey, {
            dayKey: row.dayKey,
            score: row.score,
            // `rounds` compte la manche en cours au moment de la fin de partie :
            // on affiche les manches réellement encaissées.
            rounds: Math.max(0, row.rounds - 1),
            name: row.name,
        });
    }

    return [...best.values()];
}
