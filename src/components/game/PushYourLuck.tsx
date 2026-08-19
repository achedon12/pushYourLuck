'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import {
    createRun, draw, bank, chooseOffer, readDeck, bankMultiplier, MAX_LIVES,
    type RunState,
} from '@/games/push-your-luck/engine';
import { dailySeed, dayKey, formatDayKey } from '@/lib/daily';
import { useLocalValue, writeLocal } from '@/lib/clientStore';
import { HTML_LANG, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionary';
import { format, plural } from '@/i18n/format';
import { trackEvent, scoreBucket } from '@/lib/analytics';
import { Card, CardBack, CardChip } from './Card';
import { RunSummary } from './RunSummary';
import { useSound } from './useSound';

export type Mode = 'daily' | 'free';

interface Float {
    key: number;
    text: string;
    tone: 'gain' | 'boost' | 'danger';
}

const STORE = {
    client: 'pyl.clientId',
    name: 'pyl.name',
    sound: 'pyl.sound',
    bestFree: 'pyl.best.free',
    playedDay: 'pyl.played.day',
} as const;

export function PushYourLuck({ locale, t }: { locale: Locale; t: Dictionary }) {
    const today = useMemo(() => dayKey(), []);
    const lang = HTML_LANG[locale];
    const g = t.game;

    const [mode, setMode] = useState<Mode>('daily');
    const [seed, setSeed] = useState(() => dailySeed(today));
    const [screen, setScreen] = useState<'intro' | 'playing' | 'over'>('intro');
    const [state, setState] = useState<RunState>(() => createRun(dailySeed(today)));
    const [actions, setActions] = useState('');
    const [floats, setFloats] = useState<Float[]>([]);
    const [shake, setShake] = useState(false);
    const [ranked, setRanked] = useState(true);
    const floatKey = useRef(0);
    // React ne re-rend pas entre deux clics rapprochés : sans cette référence,
    // le second calculerait son coup depuis l'état d'avant le premier et
    // produirait une suite d'actions incohérente — que le serveur rejetterait
    // au rejeu.
    const live = useRef(state);

    const soundOn = useLocalValue(STORE.sound) !== 'off';
    const bestFree = Number(useLocalValue(STORE.bestFree) ?? 0);
    const playedToday = useLocalValue(STORE.playedDay) === today;

    const play = useSound(soundOn);
    const deck = useMemo(() => readDeck(state), [state]);
    const payout = Math.round(state.pot * bankMultiplier(state.drawn.length));

    // Identifiant anonyme posé une fois par navigateur : il borne le classement
    // à un score par joueur et par jour sans imposer de compte.
    useEffect(() => {
        if (!localStorage.getItem(STORE.client)) {
            writeLocal(STORE.client, crypto.randomUUID());
        }
    }, []);

    const pushFloat = useCallback((text: string, tone: Float['tone']) => {
        const key = floatKey.current++;
        setFloats((f) => [...f, { key, text, tone }]);
        setTimeout(() => setFloats((f) => f.filter((x) => x.key !== key)), 1100);
    }, []);

    /** Applique un nouvel état et traduit ses événements en retours sensoriels. */
    const commit = useCallback(
        (next: RunState, action: string) => {
            // Le moteur renvoie l'état inchangé quand l'action est illégale dans la
            // phase courante. L'enregistrer quand même casserait le rejeu serveur,
            // qui refuse toute suite contenant une action sans effet — c'est ce qui
            // arrivait en martelant Espace pendant l'animation de fin de partie.
            if (next === live.current) return;

            const step = next.drawn.length;
            for (const event of next.events) {
                switch (event.type) {
                    case 'gain':
                        if (event.amount > 0) { pushFloat(`+${event.amount}`, 'gain'); play('gain', step); }
                        break;
                    case 'multiply':
                        pushFloat(`×${event.factor}`, 'boost'); play('boost');
                        break;
                    case 'defuse':
                        pushFloat(`−1 ${t.cards.bomb.name}`, 'boost'); play('boost');
                        break;
                    case 'reveal':
                        play('shop');
                        break;
                    case 'insure':
                        pushFloat(t.cards.shield.name, 'boost'); play('boost');
                        break;
                    case 'bomb':
                        pushFloat(event.saved > 0 ? `+${event.saved}` : 'BOOM', 'danger');
                        play('bomb');
                        setShake(true);
                        setTimeout(() => setShake(false), 520);
                        break;
                    case 'bank':
                        pushFloat(`+${event.amount}`, 'gain'); play('bank');
                        break;
                    case 'game-over':
                        // Le palier de score et le nombre de manches suffisent à
                        // voir où les parties s'arrêtent, sans suivre personne.
                        trackEvent('game', 'over', scoreBucket(event.score), next.round - 1);
                        setTimeout(() => { play('over'); setScreen('over'); }, 900);
                        break;
                }
            }
            live.current = next;
            setState(next);
            setActions((a) => a + action);
        },
        [play, pushFloat, t],
    );

    const start = useCallback(
        (nextMode: Mode) => {
            const nextSeed = nextMode === 'daily'
                ? dailySeed(today)
                : (crypto.getRandomValues(new Uint32Array(1))[0] >>> 0);
            const fresh = createRun(nextSeed);
            // Figé au lancement : une fois la tentative du jour consommée, les
            // parties suivantes sur le même paquet ne sont plus classables,
            // sinon « une seule tentative » ne veut rien dire.
            setRanked(nextMode === 'free' || !playedToday);
            setMode(nextMode);
            setSeed(nextSeed);
            live.current = fresh;
            setState(fresh);
            setActions('');
            setScreen('playing');
            trackEvent('game', 'start', nextMode);
            play('shop');
        },
        [today, play, playedToday],
    );

    const onDraw = useCallback(() => {
        play('draw', live.current.drawn.length);
        commit(draw(live.current), 'd');
    }, [commit, play]);

    const onBank = useCallback(() => commit(bank(live.current), 'b'), [commit]);

    const onOffer = useCallback(
        (index: number | null) => {
            play('shop');
            commit(chooseOffer(live.current, index), index === null ? 's' : String(index));
        },
        [commit, play],
    );

    // Fin de partie : on retient le record local et on verrouille la partie du
    // jour. L'effet n'écrit que dans le navigateur — le composant relit ces
    // valeurs par le store, il n'en garde pas de copie.
    useEffect(() => {
        if (screen !== 'over') return;
        if (mode === 'free' && state.score > bestFree) writeLocal(STORE.bestFree, String(state.score));
        if (mode === 'daily') writeLocal(STORE.playedDay, today);
    }, [screen, mode, state.score, bestFree, today]);

    // Clavier : Espace pour tirer, E pour encaisser — le jeu doit se jouer à une main.
    useEffect(() => {
        if (screen !== 'playing' || state.phase === 'shop' || state.phase === 'over') return;
        const onKey = (e: KeyboardEvent) => {
            if (e.repeat) return;
            if (e.code === 'Space') { e.preventDefault(); onDraw(); }
            if (e.key.toLowerCase() === 'e' && state.pot > 0) { e.preventDefault(); onBank(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [screen, state.phase, state.pot, onDraw, onBank]);

    const toggleSound = () => writeLocal(STORE.sound, soundOn ? 'off' : 'on');

    if (screen === 'intro') {
        return (
            <Intro
                t={t}
                lang={lang}
                today={today}
                playedToday={playedToday}
                bestFree={bestFree}
                onStart={start}
            />
        );
    }

    if (screen === 'over') {
        return (
            <RunSummary
                locale={locale}
                t={t}
                mode={mode}
                seed={seed}
                actions={actions}
                state={state}
                today={today}
                ranked={ranked}
                onReplay={() => setScreen('intro')}
            />
        );
    }

    const risk = Math.round(deck.bustChance * 100);

    return (
        <div className={`flex flex-col gap-5 ${shake ? 'animate-shake' : ''}`}>
            {/* En-tête : manche, vies, score */}
            <header className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-surface/70 px-3 py-3 sm:px-4">
                <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-faint">
                        {mode === 'daily' ? g.modeDaily : g.modeFree}
                    </span>
                    <span className="text-sm text-muted">{format(g.round, { n: state.round })}</span>
                </div>

                <div className="flex items-center gap-1" aria-label={format(g.livesLabel, { n: state.lives })}>
                    {Array.from({ length: MAX_LIVES }, (_, i) => (
                        <Heart
                            key={i}
                            size={16}
                            className={i < state.lives ? 'fill-danger text-danger' : 'text-faint/40'}
                            aria-hidden
                        />
                    ))}
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="text-right">
                        <span className="block text-[11px] uppercase tracking-[0.18em] text-faint">{g.score}</span>
                        <span className="tnum block text-lg font-semibold">{state.score}</span>
                    </div>
                    <button
                        type="button"
                        onClick={toggleSound}
                        className="rounded-lg border border-line p-1.5 text-muted transition hover:border-line-hi hover:text-text"
                        aria-label={soundOn ? g.soundOn : g.soundOff}
                    >
                        {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                </div>
            </header>

            {/* Jauge de risque : l'information sur laquelle repose toute la décision */}
            <div>
                <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
                    <span className="uppercase tracking-[0.18em] text-faint">
                        {/* Libellé court sous 400 px : le long passe à la ligne et
                            désaligne la jauge. */}
                        <span className="max-[400px]:hidden">{g.riskLabel}</span>
                        <span className="min-[401px]:hidden">{g.riskLabelShort}</span>
                    </span>
                    <span className={`tnum font-semibold ${risk >= 33 ? 'text-danger' : risk >= 22 ? 'text-gold' : 'text-success'}`}>
                        {risk} %
                    </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-tint-hi">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${risk >= 33 ? 'bg-danger' : risk >= 22 ? 'bg-gold' : 'bg-success'}`}
                        style={{ width: `${Math.min(100, risk)}%` }}
                    />
                </div>
            </div>

            {/* Plateau */}
            <div className="relative flex min-h-[15rem] flex-col items-center justify-center gap-4">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center">
                    {floats.map((f) => (
                        <span
                            key={f.key}
                            className={`animate-float-up absolute text-2xl font-bold ${
                                f.tone === 'danger' ? 'text-danger' : f.tone === 'boost' ? 'text-brand-soft' : 'text-gold'
                            }`}
                            style={{ marginLeft: ((f.key % 3) - 1) * 46 }}
                        >
                            {f.text}
                        </span>
                    ))}
                </div>

                {state.lastCard ? (
                    <div key={state.drawn.length} className="animate-pop-in">
                        <Card id={state.lastCard} cards={t.cards} size="lg" />
                    </div>
                ) : (
                    <CardBack size="lg" />
                )}

                {state.revealed > 0 && (
                    <div className="flex flex-col items-center gap-1.5">
                        <span className="text-[11px] uppercase tracking-[0.18em] text-success">
                            {plural(lang, state.revealed, g.sonarLead)}
                        </span>
                        <div className="flex gap-1.5">
                            {state.deck.slice(0, state.revealed).map((id, i) => (
                                <Card key={`${id}-${i}`} id={id} cards={t.cards} size="sm" />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Pot + valeur réelle d'un encaissement */}
            <div className="rounded-2xl border border-line bg-surface/70 px-4 py-4 text-center sm:px-5">
                <span className="text-[11px] uppercase tracking-[0.18em] text-faint">{g.pot}</span>
                <div className="mt-1 flex items-center justify-center gap-3">
                    <span className="tnum text-5xl font-bold text-gold">{state.pot}</span>
                    {state.drawn.length > 1 && (
                        <span className="tnum rounded-lg border border-brand/40 bg-brand/12 px-2 py-1 text-sm font-semibold text-brand-soft">
                            ×{bankMultiplier(state.drawn.length).toFixed(2)}
                        </span>
                    )}
                </div>
                <p className="mt-1 text-sm text-muted">
                    {state.pot > 0 ? format(g.payout, { n: payout }) : g.potEmpty}
                </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={onDraw}
                    className="group relative overflow-hidden rounded-2xl border border-brand/40 bg-brand/12 px-4 py-4 text-center transition hover:bg-brand/20 active:scale-[.98]"
                >
                    <span className="block text-lg font-semibold text-brand-soft">{g.draw}</span>
                    <span className="tnum block text-xs text-muted">{format(g.drawRisk, { n: risk })}</span>
                    <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-tint-hi opacity-0 group-hover:opacity-100" style={{ animation: 'sheen 1.1s ease-in-out infinite' }} aria-hidden />
                </button>

                <button
                    type="button"
                    onClick={onBank}
                    disabled={state.pot <= 0}
                    className="rounded-2xl border border-gold/40 bg-gold/12 px-4 py-4 text-center transition enabled:hover:bg-gold/22 enabled:active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-35"
                    style={state.pot > 0 ? { animation: 'pulse-ring 1.9s ease-out infinite' } : undefined}
                >
                    <span className="block text-lg font-semibold text-gold-soft">{g.bank}</span>
                    <span className="tnum block text-xs text-muted">
                        {state.pot > 0 ? format(g.bankGain, { n: payout }) : '—'}
                    </span>
                </button>
            </div>

            <p className="text-center text-xs text-faint">{g.shortcuts}</p>

            {/* Composition du paquet — l'information publique qui rend le jeu jouable */}
            <section className="rounded-2xl border border-line bg-surface/40 p-4">
                <h2 className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 text-xs uppercase tracking-[0.18em] text-faint">
                    <span>{g.deckTitle}</span>
                    <span className="tnum">
                        {plural(lang, deck.size, g.deckCount)} · {plural(lang, deck.bombs, g.deckBombs)}
                    </span>
                </h2>
                <ul className="flex flex-wrap gap-1.5">
                    {deck.composition.map(({ id, count }) => (
                        <li key={id}>
                            <CardChip id={id} cards={t.cards} count={count} />
                        </li>
                    ))}
                </ul>
            </section>

            {/* Boutique entre deux manches */}
            {state.phase === 'shop' && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/85 p-4 backdrop-blur-sm">
                    <div className="animate-rise w-full max-w-lg rounded-3xl border border-line-hi bg-surface p-4 sm:p-6">
                        <h2 className="text-center text-xl font-semibold">{g.shopTitle}</h2>
                        <p className="mt-1 text-center text-sm text-muted">{g.shopText}</p>
                        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                            {state.offers.map((id, i) => (
                                <button
                                    key={`${id}-${i}`}
                                    type="button"
                                    onClick={() => onOffer(i)}
                                    className="rounded-2xl transition hover:-translate-y-1 hover:brightness-110 active:scale-95"
                                >
                                    <Card id={id} cards={t.cards} size="md" fluid />
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => onOffer(null)}
                            className="mt-5 w-full rounded-xl border border-line px-4 py-3 text-sm text-muted transition hover:border-line-hi hover:text-text"
                        >
                            {g.shopSkip}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function Intro({
    t, lang, today, playedToday, bestFree, onStart,
}: {
    t: Dictionary;
    lang: string;
    today: string;
    playedToday: boolean;
    bestFree: number;
    onStart: (mode: Mode) => void;
}) {
    const g = t.game;

    return (
        <div className="animate-rise flex flex-col gap-4">
            <button
                type="button"
                onClick={() => onStart('daily')}
                className="rounded-3xl border border-gold/35 bg-gradient-to-b from-gold/12 to-transparent p-5 text-left transition hover:border-gold/60 sm:p-6"
            >
                <span className="text-[11px] uppercase tracking-[0.2em] text-gold" data-testid="daily-date">
                    {formatDayKey(today, lang)}
                </span>
                <h2 className="mt-1 text-2xl font-semibold">{g.introDaily}</h2>
                <p className="mt-1 text-sm text-muted">
                    {g.introDailyText}
                    {playedToday && <strong className="text-gold-soft"> {g.introDailyPlayed}</strong>}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold-soft">
                    {playedToday ? g.introReplayUnranked : g.introPlay} →
                </span>
            </button>

            <button
                type="button"
                onClick={() => onStart('free')}
                className="rounded-3xl border border-line bg-surface/60 p-5 text-left transition hover:border-line-hi sm:p-6"
            >
                <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-faint">
                    <RotateCcw size={13} aria-hidden /> {g.introFreeKicker}
                </span>
                <h2 className="mt-1 text-2xl font-semibold">{g.introFree}</h2>
                <p className="mt-1 text-sm text-muted">
                    {g.introFreeText}
                    {bestFree > 0 && <> {format(g.introFreeBest, { score: bestFree })}</>}
                </p>
            </button>
        </div>
    );
}
