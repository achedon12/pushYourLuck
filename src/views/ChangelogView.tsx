import { Sparkles, Scale, Wrench } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { CHANGELOG, type ChangeType } from '@/content/changelog';
import { HTML_LANG, type Locale } from '@/i18n/config';
import { dict } from '@/i18n/dictionary';

const TAG_STYLES: Record<ChangeType, { icon: typeof Sparkles; className: string }> = {
    feature: { icon: Sparkles, className: 'border-brand/40 bg-brand/12 text-brand-soft' },
    balance: { icon: Scale, className: 'border-gold/40 bg-gold/12 text-gold-soft' },
    fix: { icon: Wrench, className: 'border-success/35 bg-success/10 text-success' },
};

export function ChangelogView({ locale }: { locale: Locale }) {
    const t = dict(locale);
    const c = t.changelog;
    const lang = HTML_LANG[locale];

    return (
        <>
            <Breadcrumbs locale={locale} routeKey="changelog" label={c.title} />
            <SiteHeader locale={locale} routeKey="changelog" />

            <main id="contenu" className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
                <h1 className="text-3xl font-semibold tracking-tight">{c.title}</h1>
                <p className="mt-2 text-sm text-muted">{c.lead}</p>

                <div className="mt-10 flex flex-col gap-10">
                    {CHANGELOG.map((release) => (
                        <article key={release.version}>
                            <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line pb-3">
                                <h2 className="text-xl font-semibold tracking-tight">{release.version}</h2>
                                <time
                                    dateTime={release.date}
                                    className="text-xs uppercase tracking-[0.15em] text-faint"
                                >
                                    {new Intl.DateTimeFormat(lang, {
                                        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
                                    }).format(new Date(`${release.date}T00:00:00Z`))}
                                </time>
                            </header>

                            <ul className="mt-4 flex flex-col gap-3">
                                {release.changes.map((change, i) => {
                                    const { icon: Icon, className } = TAG_STYLES[change.type];
                                    return (
                                        <li key={i} className="flex flex-col gap-1.5 sm:flex-row sm:gap-3">
                                            <span
                                                className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
                                            >
                                                <Icon size={12} aria-hidden />
                                                {c.tags[change.type]}
                                            </span>
                                            <p className="text-sm leading-relaxed text-muted">{change[locale]}</p>
                                        </li>
                                    );
                                })}
                            </ul>
                        </article>
                    ))}
                </div>
            </main>

            <SiteFooter locale={locale} />
        </>
    );
}
