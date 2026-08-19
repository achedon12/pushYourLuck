import { SiteHeader } from '@/components/SiteHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { site } from '@/lib/site';
import { HTML_LANG, type Locale } from '@/i18n/config';
import { dict } from '@/i18n/dictionary';
import { format } from '@/i18n/format';
import { CHANGELOG } from '@/content/changelog';

export function LegalView({ locale }: { locale: Locale }) {
    const t = dict(locale);
    const g = t.legal;
    const lang = HTML_LANG[locale];

    // La date de mise à jour suit la dernière version publiée : une date écrite
    // en dur devient fausse au premier oubli.
    const updated = new Intl.DateTimeFormat(lang, {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
    }).format(new Date(`${CHANGELOG[0].date}T00:00:00Z`));

    const sections = [
        { title: g.editorTitle, body: format(g.editorBody, { site: site.url.replace('https://', ''), author: site.author.name, email: site.contact }) },
        { title: g.hostTitle, body: g.hostBody },
        { title: g.ipTitle, body: g.ipBody },
        { title: g.liabilityTitle, body: g.liabilityBody },
        { title: g.ageTitle, body: g.ageBody },
    ];

    return (
        <>
            <Breadcrumbs locale={locale} routeKey="legal" label={g.title} />
            <SiteHeader locale={locale} routeKey="legal" />

            <main id="contenu" className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
                <h1 className="text-3xl font-semibold tracking-tight">{g.title}</h1>

                <div className="mt-8 flex flex-col gap-8">
                    {sections.map(({ title, body }) => (
                        <section key={title}>
                            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                        </section>
                    ))}
                </div>

                <p className="mt-10 text-xs text-faint">{format(g.updated, { date: updated })}</p>
            </main>

            <SiteFooter locale={locale} />
        </>
    );
}
