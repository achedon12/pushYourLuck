import Link from 'next/link';
import { PushYourLuck } from '@/components/game/PushYourLuck';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import type { Locale } from '@/i18n/config';
import { dict } from '@/i18n/dictionary';
import { path } from '@/i18n/routes';

export function HomeView({ locale }: { locale: Locale }) {
    const t = dict(locale);
    const h = t.home;

    // Le corps éditorial est coupé autour du lien : `dangerouslySetInnerHTML`
    // sur une chaîne traduite ouvrirait une injection pour rien.
    const [s3Before, s3After] = h.s3Body.split('{leaderboard}');
    const [rulesBefore, rulesAfter] = h.rulesLine.split('{link}');

    return (
        <>
            <SiteHeader locale={locale} routeKey="home" />

            <main id="contenu" className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{h.h1}</h1>
                    <p className="mx-auto mt-2 max-w-md text-sm text-muted">{h.lead}</p>
                </div>

                <PushYourLuck locale={locale} t={t} />

                {/* Contenu éditorial : il porte le référencement de la page d'accueil,
                    que le jeu — entièrement rendu côté client — ne peut pas porter. */}
                <section className="mt-16 flex flex-col gap-8">
                    <article>
                        <h2 className="text-xl font-semibold tracking-tight">{h.s1Title}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted">{h.s1Body}</p>
                    </article>

                    <article>
                        <h2 className="text-xl font-semibold tracking-tight">{h.s2Title}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted">{h.s2Body}</p>
                    </article>

                    <article>
                        <h2 className="text-xl font-semibold tracking-tight">{h.s3Title}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                            {s3Before}
                            <Link href={path('leaderboard', locale)} className="text-brand-soft underline underline-offset-2">
                                {h.s3Link}
                            </Link>
                            {s3After}
                        </p>
                    </article>

                    <p className="text-sm text-muted">
                        {rulesBefore}
                        <Link href={path('rules', locale)} className="text-brand-soft underline underline-offset-2">
                            {h.rulesLink}
                        </Link>
                        {rulesAfter}
                    </p>
                </section>
            </main>

            <SiteFooter locale={locale} />
        </>
    );
}
