/**
 * Aides de navigation du calendrier.
 *
 * La borne basse n'est pas une constante : c'est le mois du plus ancien score
 * en base. Une borne figée laisserait explorer une infinité de mois vides —
 * pour l'utilisateur comme pour les robots d'indexation — et, à l'inverse,
 * empêcherait de remonter l'historique une fois qu'il existe.
 */
export function shiftMonth(month: string, delta: number): string {
    const [year, m] = month.split('-').map(Number);
    const date = new Date(Date.UTC(year, m - 1 + delta, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function clampMonth(month: string | undefined, firstMonth: string, currentMonth: string): string {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) return currentMonth;
    if (month < firstMonth) return firstMonth;
    if (month > currentMonth) return currentMonth;
    return month;
}
