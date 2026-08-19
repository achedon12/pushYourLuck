import type { Metadata } from 'next';
import { LeaderboardView } from '@/views/LeaderboardView';
import { pageMetadata } from '@/lib/metadata';
import { dict } from '@/i18n/dictionary';
import { MONTH_PARAM } from '@/i18n/routes';

const LOCALE = 'fr' as const;
const t = dict(LOCALE);

export const metadata: Metadata = pageMetadata({
    locale: LOCALE,
    key: 'leaderboard',
    title: t.leaderboard.title,
    description: t.leaderboard.description,
});

// Le classement change à chaque score envoyé : il est rendu à la demande.
export const dynamic = 'force-dynamic';

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const requested = (await searchParams)[MONTH_PARAM[LOCALE]];
    return <LeaderboardView locale={LOCALE} requestedMonth={typeof requested === 'string' ? requested : undefined} />;
}
