import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { ScoreCalendar } from '@/components/ScoreCalendar';
import { bestPerDay, type DayBest } from '@/lib/calendar';
import { prisma } from '@/lib/prisma';
import { dayKey, formatDayKey } from '@/lib/daily';
import { HTML_LANG, type Locale } from '@/i18n/config';
import { dict } from '@/i18n/dictionary';
import { format, plural } from '@/i18n/format';
import { path, MONTH_PARAM } from '@/i18n/routes';
import { clampMonth } from '@/lib/months';

const GAME = 'push-your-luck';

export async function LeaderboardView({
    locale, requestedMonth,
}: {
    locale: Locale;
    /** Mois demandé dans l'URL ; borné aux mois réellement jouables. */
    requestedMonth?: string;
}) {
    const t = dict(locale);
    const lang = HTML_LANG[locale];
    const l = t.leaderboard;
    const today = dayKey();
    const currentMonth = today.slice(0, 7);

    // Le plus ancien jour joué borne la navigation du calendrier.
    const oldest = await prisma.score
        .findFirst({
            where: { game: GAME, mode: 'daily' },
            orderBy: { dayKey: 'asc' },
            select: { dayKey: true },
        })
        .catch(() => null);
    const firstMonth = oldest?.dayKey?.slice(0, 7) ?? currentMonth;
    const month = clampMonth(requestedMonth, firstMonth, currentMonth);

    // Base injoignable = page dégradée, jamais une 500 : le classement est un
    // agrément, il ne doit pas emporter le site avec lui. C'est aussi ce qui
    // permet au build Docker de tourner sans base.
    const [daily, free, calendar] = await Promise.all([
        prisma.score
            .findMany({
                where: { game: GAME, mode: 'daily', dayKey: today },
                orderBy: [{ score: 'desc' }, { rounds: 'asc' }, { createdAt: 'asc' }],
                take: 50,
                select: { name: true, score: true, rounds: true },
            })
            .catch(() => []),
        prisma.score
            .findMany({
                where: { game: GAME, mode: 'free' },
                orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
                take: 10,
                select: { name: true, score: true },
            })
            .catch(() => []),
        // `groupBy` ne rendrait que le score maximum ; le calendrier affiche
        // aussi les manches et le nom, qui appartiennent à UNE ligne précise.
        // On lit donc le mois trié et on retient la première ligne de chaque
        // jour — un mois de scores tient largement en mémoire.
        prisma.score
            .findMany({
                where: { game: GAME, mode: 'daily', dayKey: { startsWith: month } },
                orderBy: [{ dayKey: 'asc' }, { score: 'desc' }, { rounds: 'asc' }],
                select: { dayKey: true, score: true, rounds: true, name: true },
            })
            .then(bestPerDay)
            .catch((): DayBest[] => []),
    ]);

    return (
        <>
            <Breadcrumbs locale={locale} routeKey="leaderboard" label={l.title} />
            <SiteHeader locale={locale} routeKey="leaderboard" />

            <main id="contenu" className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
                <h1 className="text-3xl font-semibold tracking-tight">{l.title}</h1>
                <p className="mt-2 text-sm text-muted" data-testid="leaderboard-date">
                    {format(l.lead, { date: formatDayKey(today, lang) })}
                </p>

                <section className="mt-8">
                    {daily.length === 0 ? (
                        <div className="rounded-2xl border border-line bg-surface/50 p-8 text-center">
                            <p className="text-sm text-muted">{l.empty}</p>
                            <Link
                                href={path('home', locale)}
                                className="mt-4 inline-block rounded-xl border border-gold/40 bg-gold/12 px-5 py-2.5 text-sm font-semibold text-gold-soft transition hover:bg-gold/20"
                            >
                                {l.emptyCta}
                            </Link>
                        </div>
                    ) : (
                        <ol className="flex flex-col gap-1">
                            {daily.map((entry, i) => (
                                <li
                                    key={`${entry.name}-${i}`}
                                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 sm:px-4 ${
                                        i === 0 ? 'border-gold/40 bg-gold/10' : 'border-line bg-surface/40'
                                    }`}
                                >
                                    <span className="flex min-w-0 items-center gap-3">
                                        <span className={`tnum w-6 shrink-0 text-right text-sm ${i === 0 ? 'text-gold' : 'text-faint'}`}>
                                            {i + 1}
                                        </span>
                                        {i === 0 && <Trophy size={15} className="shrink-0 text-gold" aria-hidden />}
                                        <span className="truncate text-sm font-medium">{entry.name}</span>
                                    </span>
                                    <span className="flex shrink-0 items-baseline gap-3">
                                        <span className="text-xs text-faint max-[400px]:hidden">
                                            {plural(lang, entry.rounds - 1, l.rounds)}
                                        </span>
                                        <span className="tnum text-lg font-semibold">{entry.score}</span>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                <ScoreCalendar
                    locale={locale}
                    today={today}
                    month={month}
                    firstMonth={firstMonth}
                    days={calendar}
                    basePath={path('leaderboard', locale)}
                    monthParam={MONTH_PARAM[locale]}
                />

                {free.length > 0 && (
                    <section className="mt-12">
                        <h2 className="text-xl font-semibold tracking-tight">{l.freeTitle}</h2>
                        <p className="mt-1 text-sm text-muted">{l.freeLead}</p>
                        <ol className="mt-4 flex flex-col gap-1">
                            {free.map((entry, i) => (
                                <li
                                    key={`${entry.name}-${i}`}
                                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm odd:bg-tint"
                                >
                                    <span className="flex min-w-0 items-center gap-3">
                                        <span className="tnum w-5 shrink-0 text-right text-faint">{i + 1}</span>
                                        <span className="truncate">{entry.name}</span>
                                    </span>
                                    <span className="tnum shrink-0 font-semibold">{entry.score}</span>
                                </li>
                            ))}
                        </ol>
                    </section>
                )}
            </main>

            <SiteFooter locale={locale} />
        </>
    );
}
