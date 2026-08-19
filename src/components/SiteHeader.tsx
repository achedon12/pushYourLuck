import Link from 'next/link';
import { TrendingUp, Languages } from 'lucide-react';
import { site } from '@/lib/site';
import type { Locale } from '@/i18n/config';
import { dict } from '@/i18n/dictionary';
import { path, type RouteKey } from '@/i18n/routes';
import { ThemeToggle } from '@/components/ThemeToggle';

export function SiteHeader({ locale, routeKey }: { locale: Locale; routeKey: RouteKey }) {
    const t = dict(locale);
    const other: Locale = locale === 'fr' ? 'en' : 'fr';

    return (
        <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2 px-3 py-3 sm:px-4">
                <Link href={path('home', locale)} className="flex items-center gap-2" aria-label={t.nav.home}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/40 bg-gold/12 text-gold">
                        <TrendingUp size={16} strokeWidth={2.2} aria-hidden />
                    </span>
                    <span className="text-sm font-semibold tracking-tight max-[479px]:hidden">{site.name}</span>
                </Link>

                <div className="flex items-center gap-1 sm:gap-2">
                    <nav aria-label={t.nav.mainNav}>
                        <ul className="flex items-center gap-0.5 text-xs sm:gap-1 sm:text-sm">
                            <li>
                                <Link href={path('leaderboard', locale)} className="rounded-lg px-2 py-1.5 text-muted transition hover:bg-tint hover:text-text sm:px-3">
                                    {t.nav.leaderboard}
                                </Link>
                            </li>
                            <li>
                                <Link href={path('rules', locale)} className="rounded-lg px-2 py-1.5 text-muted transition hover:bg-tint hover:text-text sm:px-3">
                                    {t.nav.rules}
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    {/* Traduction de la page COURANTE, pas retour à l'accueil : c'est
                        la seule bascule de langue qui ne fait pas perdre sa place. */}
                    <Link
                        href={path(routeKey, other)}
                        hrefLang={other}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition hover:border-line-hi hover:text-text"
                        aria-label={t.nav.switchLanguage}
                        title={t.nav.switchLanguage}
                    >
                        <Languages size={15} aria-hidden />
                    </Link>

                    <ThemeToggle label={t.nav.toggleTheme} />
                </div>
            </div>
        </header>
    );
}
