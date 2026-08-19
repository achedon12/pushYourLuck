import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { CARDS, STARTING_DECK } from '@/games/push-your-luck/cards';
import { MAX_LIVES, BANK_GROWTH } from '@/games/push-your-luck/engine';
import { CARD_ICONS } from '@/components/game/cardIcons';
import { HTML_LANG, type Locale } from '@/i18n/config';
import { dict } from '@/i18n/dictionary';
import { format } from '@/i18n/format';
import { path } from '@/i18n/routes';
import { absoluteUrl } from '@/lib/site';

export function RulesView({ locale }: { locale: Locale }) {
    const t = dict(locale);
    const r = t.rules;

    const bombs = STARTING_DECK.filter((id) => id === 'bomb').length;
    const growth = Math.round((BANK_GROWTH - 1) * 100);
    const [twistBefore, twistAfter] = format(r.twistBody, {
        deck: STARTING_DECK.length,
        bombs,
        strong: '{strong}',
    }).split('{strong}');

    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        '@id': absoluteUrl(`${path('rules', locale)}#faq`),
        inLanguage: HTML_LANG[locale],
        mainEntity: r.faq.map(({ q, a }) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a },
        })),
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            <Breadcrumbs locale={locale} routeKey="rules" label={r.title} />
            <SiteHeader locale={locale} routeKey="rules" />

            <main id="contenu" className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
                <h1 className="text-3xl font-semibold tracking-tight">{r.title}</h1>
                <p className="mt-2 text-sm text-muted">{r.lead}</p>

                <section className="mt-10">
                    <h2 className="text-xl font-semibold tracking-tight">{r.turnTitle}</h2>
                    <ol className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-muted">
                        <li><strong className="text-text">{r.turnDraw}</strong> {r.turnDrawText}</li>
                        <li><strong className="text-text">{r.turnBank}</strong> {r.turnBankText}</li>
                        <li><strong className="text-text">{r.turnBust}</strong> {format(r.turnBustText, { lives: MAX_LIVES })}</li>
                    </ol>
                </section>

                <section className="mt-10">
                    <h2 className="text-xl font-semibold tracking-tight">{r.bonusTitle}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{format(r.bonusBody, { growth })}</p>
                </section>

                <section className="mt-10">
                    <h2 className="text-xl font-semibold tracking-tight">{r.twistTitle}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                        {twistBefore}
                        <strong className="text-text">{r.twistStrong}</strong>
                        {twistAfter}
                    </p>
                </section>

                <section className="mt-10">
                    <h2 className="text-xl font-semibold tracking-tight">{r.cardsTitle}</h2>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[22rem] border-collapse text-sm">
                            <thead>
                            <tr className="border-b border-line text-left text-xs uppercase tracking-[0.15em] text-faint">
                                <th scope="col" className="py-2 pr-3 font-medium">{r.colCard}</th>
                                <th scope="col" className="py-2 font-medium">{r.colEffect}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Object.values(CARDS).map((card) => {
                                const Icon = CARD_ICONS[card.icon];
                                const copy = t.cards[card.id as keyof typeof t.cards];
                                return (
                                    <tr key={card.id} className="border-b border-line/60">
                                        <th scope="row" className="py-2.5 pr-3 text-left font-medium">
                                            <span className="flex items-center gap-2">
                                                <Icon size={16} strokeWidth={1.7} className="text-faint" aria-hidden />
                                                {copy.name}
                                            </span>
                                        </th>
                                        <td className="py-2.5 text-muted">{copy.text}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mt-10">
                    <h2 className="text-xl font-semibold tracking-tight">{r.tipsTitle}</h2>
                    <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-muted">
                        <li>{r.tip1}</li>
                        <li>{r.tip2}</li>
                        <li>{r.tip3}</li>
                    </ul>
                </section>

                <section className="mt-10" id="faq">
                    <h2 className="text-xl font-semibold tracking-tight">{r.faqTitle}</h2>
                    <dl className="mt-4 flex flex-col gap-5">
                        {r.faq.map(({ q, a }) => (
                            <div key={q}>
                                <dt className="text-sm font-semibold">{q}</dt>
                                <dd className="mt-1 text-sm leading-relaxed text-muted">{a}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <p className="mt-12 text-center">
                    <Link
                        href={path('home', locale)}
                        className="inline-block rounded-xl border border-gold/40 bg-gold/12 px-6 py-3 text-sm font-semibold text-gold-soft transition hover:bg-gold/20"
                    >
                        {r.playNow}
                    </Link>
                </p>
            </main>

            <SiteFooter locale={locale} />
        </>
    );
}
