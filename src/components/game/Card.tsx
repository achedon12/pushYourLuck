import { CARDS } from '@/games/push-your-luck/cards';
import type { Dictionary } from '@/i18n/dictionary';
import { CARD_ICONS } from './cardIcons';

/** Noms et descriptions des cartes, traduits — voir la note dans cards.ts. */
export type CardCopy = Dictionary['cards'];

const copyFor = (cards: CardCopy, id: string) => cards[id as keyof CardCopy];

const TONE_STYLES = {
    gain:   { ring: 'border-gold/35',    glow: 'shadow-[0_0_44px_-14px_var(--glow-gold)]',  text: 'text-gold-soft',  icon: 'text-gold',    bg: 'from-gold/12' },
    boost:  { ring: 'border-brand/40',   glow: 'shadow-[0_0_44px_-14px_var(--glow-brand)]',  text: 'text-brand-soft', icon: 'text-brand-soft', bg: 'from-brand/14' },
    danger: { ring: 'border-danger/45',  glow: 'shadow-[0_0_46px_-12px_var(--glow-danger)]',   text: 'text-danger',     icon: 'text-danger',  bg: 'from-danger/14' },
    tool:   { ring: 'border-success/35', glow: 'shadow-[0_0_44px_-14px_var(--glow-success)]',   text: 'text-success',    icon: 'text-success', bg: 'from-success/12' },
} as const;

const SIZES = {
    sm: { box: 'w-16 h-[5.5rem] rounded-xl p-1.5 gap-1', boxFluid: 'w-full h-[5.5rem] rounded-xl p-1.5 gap-1', icon: 18, title: 'text-[9px]' },
    md: { box: 'w-32 h-44 rounded-2xl p-3 gap-1.5',      boxFluid: 'w-full h-44 rounded-2xl p-2 gap-1.5',      icon: 34, title: 'text-sm' },
    lg: { box: 'w-40 h-56 rounded-3xl p-4 gap-2',        boxFluid: 'w-full h-56 rounded-3xl p-4 gap-2',        icon: 44, title: 'text-base' },
} as const;

export function Card({
    id, cards, size = 'md', fluid = false,
}: {
    id: string;
    cards: CardCopy;
    size?: keyof typeof SIZES;
    /** Largeur portée par le parent — la boutique en a besoin : trois cartes de
     *  largeur fixe débordent sous 400 px de large. */
    fluid?: boolean;
}) {
    const def = CARDS[id];
    const copy = copyFor(cards, id);
    const tone = TONE_STYLES[def.tone];
    const dims = SIZES[size];
    const Icon = CARD_ICONS[def.icon];

    return (
        <div
            className={`relative flex flex-col items-center justify-center overflow-hidden border bg-surface bg-gradient-to-b to-transparent text-center ${fluid ? dims.boxFluid : dims.box} ${tone.ring} ${tone.bg} ${size !== 'sm' ? tone.glow : ''}`}
        >
            <Icon size={dims.icon} strokeWidth={1.6} className={tone.icon} aria-hidden />
            <span className={`font-semibold ${dims.title} ${tone.text}`}>{copy.name}</span>
            {size !== 'sm' && <span className="text-[11px] leading-tight text-muted">{copy.text}</span>}
        </div>
    );
}

/** Dos de carte — occupe la place de la carte à venir sans la révéler. */
export function CardBack({ size = 'md' }: { size?: keyof typeof SIZES }) {
    const box = {
        sm: 'w-16 h-[5.5rem] rounded-xl',
        md: 'w-32 h-44 rounded-2xl',
        lg: 'w-40 h-56 rounded-3xl',
    }[size];

    return (
        <div className={`relative flex items-center justify-center overflow-hidden border border-line-hi bg-bg-soft ${box}`}>
            <div
                className="absolute inset-0 opacity-45"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(45deg, transparent 0 7px, var(--back-stripe) 7px 14px)',
                }}
                aria-hidden
            />
            <span className="relative font-mono text-2xl text-faint" aria-hidden>?</span>
        </div>
    );
}

/** Puce compacte utilisée par la liste de composition du paquet. */
export function CardChip({ id, cards, count }: { id: string; cards: CardCopy; count: number }) {
    const def = CARDS[id];
    const Icon = CARD_ICONS[def.icon];
    const tone = TONE_STYLES[def.tone];

    return (
        <span className="flex items-center gap-1.5 rounded-lg border border-line bg-bg-soft px-2 py-1 text-xs">
            <Icon size={13} strokeWidth={1.8} className={tone.icon} aria-hidden />
            <span className="text-muted">{copyFor(cards, id).name}</span>
            <span className="tnum font-semibold text-text">×{count}</span>
        </span>
    );
}
