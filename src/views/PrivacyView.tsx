import { SiteHeader } from '@/components/SiteHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { site } from '@/lib/site';
import { HTML_LANG, type Locale } from '@/i18n/config';
import { dict } from '@/i18n/dictionary';
import { format } from '@/i18n/format';
import { CHANGELOG } from '@/content/changelog';

export function PrivacyView({ locale }: { locale: Locale }) {
    const t = dict(locale);
    const p = t.privacy;
    const lang = HTML_LANG[locale];

    const updated = new Intl.DateTimeFormat(lang, {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
    }).format(new Date(`${CHANGELOG[0].date}T00:00:00Z`));

    return (
        <>
            <Breadcrumbs locale={locale} routeKey="privacy" label={p.title} />
            <SiteHeader locale={locale} routeKey="privacy" />

            <main id="contenu" className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
                <h1 className="text-3xl font-semibold tracking-tight">{p.title}</h1>
                <p className="mt-2 text-sm text-muted">{p.lead}</p>

                <section className="mt-8">
                    <h2 className="text-xl font-semibold tracking-tight">{p.storedTitle}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{p.storedIntro}</p>
                    <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-muted">
                        <li>{p.stored1}</li>
                        <li>{p.stored2}</li>
                        <li>{p.stored3}</li>
                    </ul>
                </section>

                {[
                    { title: p.localTitle, body: p.localBody },
                    { title: p.cookiesTitle, body: p.cookiesBody },
                    { title: p.rightsTitle, body: format(p.rightsBody, { email: site.contact }) },
                    { title: p.retentionTitle, body: p.retentionBody },
                ].map(({ title, body }) => (
                    <section key={title} className="mt-8">
                        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                    </section>
                ))}

                <p className="mt-10 text-xs text-faint">{format(p.updated, { date: updated })}</p>
            </main>

            <SiteFooter locale={locale} />
        </>
    );
}
