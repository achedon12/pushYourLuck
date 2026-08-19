import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { dict } from '@/i18n/dictionary';
import { path } from '@/i18n/routes';
import { format } from '@/i18n/format';
import { site } from '@/lib/site';

/** Injectée à la construction depuis package.json — voir next.config.ts. */
const version = process.env.NEXT_PUBLIC_APP_VERSION;

export function SiteFooter({ locale }: { locale: Locale }) {
    const t = dict(locale);

    const links = [
        { key: 'home', label: t.footer.play },
        { key: 'rules', label: t.nav.rules },
        { key: 'leaderboard', label: t.nav.leaderboard },
        { key: 'changelog', label: t.nav.changelog },
        { key: 'legal', label: t.footer.legal },
        { key: 'privacy', label: t.footer.privacy },
    ] as const;

    return (
        <footer className="mt-16 border-t border-line py-8">
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 text-center">
                <p className="text-sm text-muted">{t.footer.tagline}</p>

                <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-faint">
                    {version && (
                        <Link
                            href={path('changelog', locale)}
                            className="tnum transition hover:text-muted"
                            title={t.footer.versionTitle}
                        >
                            v{version}
                        </Link>
                    )}
                    <span aria-hidden>·</span>
                    <span>{format(t.footer.madeBy, { author: site.author.name })}</span>
                    <span aria-hidden>·</span>
                    {/* `rel="author"` désigne explicitement la page de l'auteur —
                        c'est le seul lien sortant du site, autant qu'il porte
                        son sens. */}
                    <a
                        href={site.author.url}
                        rel="author"
                        className="transition hover:text-muted"
                    >
                        {site.author.url.replace('https://', '')}
                    </a>
                </p>
                <nav aria-label={t.nav.footerNav}>
                    <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-faint">
                        {links.map(({ key, label }) => (
                            <li key={key}>
                                <Link href={path(key, locale)} className="transition hover:text-muted">
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </footer>
    );
}
