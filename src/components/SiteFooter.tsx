import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { dict } from '@/i18n/dictionary';
import { path } from '@/i18n/routes';

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
