import Link from 'next/link';
import { Trophy, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarDays } from 'lucide-react';
import { formatDayKey } from '@/lib/daily';
import { shiftMonth } from '@/lib/months';
import { buildMonthGrid, type DayBest } from '@/lib/calendar';
import { HTML_LANG, type Locale } from '@/i18n/config';
import { dict } from '@/i18n/dictionary';
import { format, plural } from '@/i18n/format';

/**
 * Calendrier du mois avec, dans chaque case, le meilleur score du jour.
 *
 * C'est le seul endroit du site où l'on voit d'un coup d'œil que la partie
 * change tous les jours — un classement seul ne raconte que l'instant présent.
 *
 * La navigation passe par des liens et un paramètre d'URL, pas par du
 * JavaScript : chaque mois est ainsi partageable, et la page reste rendue
 * côté serveur.
 */
export function ScoreCalendar({
    locale, today, month, firstMonth, days, basePath, monthParam,
}: {
    locale: Locale;
    /** Clé du jour courant (YYYY-MM-DD), pour marquer « aujourd'hui » et borner le futur. */
    today: string;
    /** Mois affiché, « YYYY-MM ». */
    month: string;
    /** Mois du plus ancien score enregistré : borne basse de la navigation. */
    firstMonth: string;
    days: DayBest[];
    /** URL de la page classement dans la langue courante. */
    basePath: string;
    monthParam: string;
}) {
    const t = dict(locale);
    const lang = HTML_LANG[locale];
    const l = t.leaderboard;

    const { year, month: monthNumber, firstWeekday, days: dayKeys } = buildMonthGrid(month);
    const currentMonth = today.slice(0, 7);
    const best = new Map(days.map((d) => [d.dayKey, d]));
    const topScore = days.reduce((max, d) => Math.max(max, d.score), 0);

    const weekdayNames = Array.from({ length: 7 }, (_, i) =>
        new Intl.DateTimeFormat(lang, { weekday: 'short', timeZone: 'UTC' })
            // 2024-01-01 était un lundi : il sert d'origine pour nommer les colonnes.
            .format(new Date(Date.UTC(2024, 0, 1 + i))),
    );
    const monthName = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(Date.UTC(year, monthNumber - 1, 1)));

    const steps = [
        { delta: -12, icon: ChevronsLeft, label: l.calendarPrevYear },
        { delta: -1, icon: ChevronLeft, label: l.calendarPrevMonth },
    ];
    const stepsAfter = [
        { delta: 1, icon: ChevronRight, label: l.calendarNextMonth },
        { delta: 12, icon: ChevronsRight, label: l.calendarNextYear },
    ];

    const linkFor = (delta: number) => {
        const target = shiftMonth(month, delta);
        if (target < firstMonth || target > currentMonth) return null;
        return target === currentMonth ? basePath : `${basePath}?${monthParam}=${target}`;
    };

    return (
        <section className="mt-12" data-testid="calendar">
            <h2 className="text-xl font-semibold tracking-tight">{l.calendarTitle}</h2>
            <p className="mt-1 text-sm text-muted">{l.calendarLead}</p>

            <div className="mt-4 rounded-2xl border border-line bg-surface/40 p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                        {steps.map(({ delta, icon: Icon, label }) => (
                            <NavButton key={delta} href={linkFor(delta)} label={label} icon={Icon} />
                        ))}
                    </div>

                    <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-faint">
                        {monthName}
                    </p>

                    <div className="flex items-center gap-1">
                        {stepsAfter.map(({ delta, icon: Icon, label }) => (
                            <NavButton key={delta} href={linkFor(delta)} label={label} icon={Icon} />
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                    {weekdayNames.map((name) => (
                        <div key={name} className="pb-1 text-center text-[10px] uppercase text-faint">
                            {name}
                        </div>
                    ))}

                    {Array.from({ length: firstWeekday }, (_, i) => <div key={`pad-${i}`} />)}

                    {dayKeys.map((key, i) => {
                        const day = i + 1;
                        const entry = best.get(key);
                        const isToday = key === today;
                        const isFuture = key > today;
                        const isTop = entry !== undefined && entry.score === topScore && topScore > 0;
                        const label = entry !== undefined
                            ? format(l.calendarBest, {
                                date: formatDayKey(key, lang),
                                score: entry.score,
                                rounds: plural(lang, entry.rounds, l.rounds),
                                name: entry.name,
                            })
                            : format(l.calendarNoScore, { date: formatDayKey(key, lang) });

                        return (
                            <div
                                key={key}
                                title={isFuture ? undefined : label}
                                aria-label={isFuture ? undefined : label}
                                className={`relative flex min-h-[3.4rem] flex-col items-center justify-center rounded-lg border px-0.5 py-1 text-center ${
                                    isFuture
                                        ? 'border-transparent opacity-35'
                                        : isTop
                                            ? 'border-gold/50 bg-gold/12'
                                            : entry !== undefined
                                                ? 'border-line bg-tint'
                                                : 'border-line/60'
                                } ${isToday ? 'ring-1 ring-brand' : ''}`}
                            >
                                <span className="tnum text-[10px] leading-none text-faint">{day}</span>
                                {entry !== undefined ? (
                                    <>
                                        <span className={`tnum mt-0.5 text-xs font-semibold leading-none ${isTop ? 'text-gold' : 'text-text'}`}>
                                            {entry.score}
                                        </span>
                                        <span className="tnum mt-0.5 text-[9px] leading-none text-faint">
                                            {entry.rounds} {l.roundsAbbr}
                                        </span>
                                    </>
                                ) : (
                                    <span className="mt-0.5 text-xs leading-none text-faint/50" aria-hidden>·</span>
                                )}
                                {isTop && (
                                    <Trophy size={9} className="absolute right-1 top-1 text-gold" aria-hidden />
                                )}
                            </div>
                        );
                    })}
                </div>

                {days.length === 0 && (
                    <p className="mt-3 text-center text-sm text-faint">{l.calendarEmpty}</p>
                )}

                {month !== currentMonth && (
                    <p className="mt-3 text-center">
                        <Link
                            href={basePath}
                            className="inline-flex items-center gap-1.5 text-xs text-muted underline underline-offset-2 transition hover:text-text"
                        >
                            <CalendarDays size={13} aria-hidden />
                            {l.calendarBackToday}
                        </Link>
                    </p>
                )}
            </div>
        </section>
    );
}

/**
 * Une borne atteinte rend le bouton inerte plutôt qu'invisible : la rangée de
 * commandes garde sa largeur, donc le nom du mois ne se décale pas d'un mois à
 * l'autre.
 */
function NavButton({
    href, label, icon: Icon,
}: {
    href: string | null;
    label: string;
    icon: typeof ChevronLeft;
}) {
    const shape = 'flex h-7 w-7 items-center justify-center rounded-lg border';

    if (!href) {
        return (
            <span className={`${shape} border-line/50 text-faint/30`} aria-hidden>
                <Icon size={14} />
            </span>
        );
    }

    return (
        <Link
            href={href}
            aria-label={label}
            title={label}
            className={`${shape} border-line text-muted transition hover:border-line-hi hover:text-text`}
        >
            <Icon size={14} />
        </Link>
    );
}
