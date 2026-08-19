import { ImageResponse } from 'next/og';
import { site } from '@/lib/site';
import { dict } from '@/i18n/dictionary';
import type { Locale } from '@/i18n/config';

export const OG_SIZE = { width: 1200, height: 630 };

/** Tracés Lucide recopiés : le moteur d'images OG ne monte pas de composants React. */
const GLYPHS = [
    { color: '#f5b544', paths: ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'] },
    {
        color: '#a08cff',
        paths: ['M9.9 15.5A2 2 0 0 0 8.5 14.1l-6.1-1.6a.5.5 0 0 1 0-1l6.1-1.6A2 2 0 0 0 9.9 8.5l1.6-6.1a.5.5 0 0 1 1 0l1.6 6.1a2 2 0 0 0 1.4 1.4l6.1 1.6a.5.5 0 0 1 0 1l-6.1 1.6a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0z'],
    },
    {
        color: '#ff4d5e',
        paths: ['M14.4 4.6 16.3 2.7a2.4 2.4 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4l-1.9 1.9', 'm22 2-1.5 1.5'],
        circle: { cx: 11, cy: 13, r: 9 },
    },
];

const SUBLINE: Record<Locale, string> = {
    fr: 'Partie du jour · classement quotidien · sans inscription',
    en: 'Daily deck · daily leaderboard · no sign-up',
};

/** Vignette de partage, générée par langue pour que l'accroche soit traduite. */
export function ogImage(locale: Locale) {
    const t = dict(locale);

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', padding: '80px 90px',
                    background: '#07070a',
                    backgroundImage:
                        'radial-gradient(900px 500px at 8% -10%, #7c5cff33, transparent 60%),' +
                        'radial-gradient(700px 400px at 100% 10%, #f5b54426, transparent 60%)',
                    color: '#f4f4f6', fontFamily: 'sans-serif',
                }}
            >
                <div style={{ display: 'flex', gap: 16, marginBottom: 34 }}>
                    {GLYPHS.map((glyph, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 96, height: 132, borderRadius: 18,
                                background: '#111117', border: '1px solid #ffffff1f',
                            }}
                        >
                            <svg width="46" height="46" viewBox="0 0 24 24" fill="none"
                                 stroke={glyph.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                {glyph.circle && (
                                    <circle cx={glyph.circle.cx} cy={glyph.circle.cy} r={glyph.circle.r} />
                                )}
                                {glyph.paths.map((d) => <path key={d} d={d} />)}
                            </svg>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', fontSize: 96, fontWeight: 800, letterSpacing: -3 }}>
                    {site.name}
                </div>
                <div style={{ display: 'flex', fontSize: 40, color: '#f5b544', marginTop: 10 }}>
                    {t.site.tagline}
                </div>
                <div style={{ display: 'flex', fontSize: 27, color: '#9a9aa8', marginTop: 26 }}>
                    {SUBLINE[locale]}
                </div>
            </div>
        ),
        OG_SIZE,
    );
}
