'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trophy, Share2, Check, Loader2 } from 'lucide-react';
import type { RunState } from '@/games/push-your-luck/engine';
import { formatDayKey, msUntilNextDay } from '@/lib/daily';
import { useLocalValue, writeLocal } from '@/lib/clientStore';
import { site } from '@/lib/site';
import { HTML_LANG, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionary';
import { format, plural } from '@/i18n/format';
import { trackEvent } from '@/lib/analytics';
import type { Mode } from './PushYourLuck';

interface Entry {
    name: string;
    score: number;
    rounds: number;
}

export function RunSummary({
    locale, t, mode, seed, actions, state, today, ranked, onReplay,
}: {
    locale: Locale;
    t: Dictionary;
    mode: Mode;
    seed: number;
    actions: string;
    state: RunState;
    today: string;
    /** Faux quand la tentative classée du jour a déjà été consommée. */
    ranked: boolean;
    onReplay: () => void;
}) {
    const lang = HTML_LANG[locale];
    const s = t.summary;

    // Le pseudo mémorisé sert de valeur par défaut sans être recopié dans un
    // état par un effet : tant que le joueur n'a rien tapé, `typed` vaut null et
    // c'est la valeur du navigateur qui s'affiche.
    const storedName = useLocalValue('pyl.name');
    const [typed, setTyped] = useState<string | null>(null);
    const name = typed ?? storedName ?? '';

    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [rank, setRank] = useState<number | null>(null);
    const [board, setBoard] = useState<Entry[] | null>(null);
    const [copied, setCopied] = useState(false);
    const [countdown, setCountdown] = useState('');

    const rounds = plural(lang, state.round - 1, s.rounds);

    const loadBoard = useCallback(async () => {
        try {
            const res = await fetch(`/api/scores?mode=${mode}&limit=10`, { cache: 'no-store' });
            const data = await res.json();
            setBoard(data.scores ?? []);
        } catch {
            setBoard([]);
        }
    }, [mode]);

    // Chargement initial du classement : une requête réseau au montage est
    // exactement ce pour quoi un effet existe, le linter ne distingue pas le
    // setState différé de l'appel synchrone.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { void loadBoard(); }, [loadBoard]);

    useEffect(() => {
        if (mode !== 'daily') return;
        const tick = () => {
            const ms = msUntilNextDay();
            const h = Math.floor(ms / 3_600_000);
            const m = Math.floor((ms % 3_600_000) / 60_000);
            const sec = Math.floor((ms % 60_000) / 1000);
            setCountdown(`${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [mode]);

    const submit = async () => {
        setStatus('sending');
        setMessage('');
        writeLocal('pyl.name', name);
        try {
            const res = await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Le score n'est pas envoyé : le serveur rejoue `actions` depuis la
                // graine et calcule lui-même le résultat.
                body: JSON.stringify({ mode, name, actions, seed, clientId: localStorage.getItem('pyl.clientId') }),
            });
            const data = await res.json();
            if (!res.ok) {
                trackEvent('score', 'rejected', String(data.error ?? 'unknown'));
                setStatus('error');
                const code = String(data.error ?? '') as keyof typeof s.errors;
                setMessage(s.errors[code] ?? s.errorSend);
                return;
            }
            trackEvent('score', 'submitted', mode, data.rank ?? undefined);
            setStatus('sent');
            setRank(data.rank ?? null);
            if (!data.saved) setMessage(format(s.keptBest, { best: data.best }));
            void loadBoard();
        } catch {
            setStatus('error');
            setMessage(s.errorServer);
        }
    };

    const share = async () => {
        const text = format(s.shareText, {
            context: mode === 'daily' ? formatDayKey(today, lang) : s.shareFree,
            score: state.score,
            rounds,
            url: site.url,
        });
        try {
            if (navigator.share) await navigator.share({ text });
            else await navigator.clipboard.writeText(text);
            trackEvent('score', 'shared', mode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
        } catch {
            /* partage annulé par l'utilisateur : rien à signaler */
        }
    };

    return (
        <div className="animate-rise flex flex-col gap-5">
            <div className="rounded-3xl border border-line-hi bg-surface/70 p-5 text-center sm:p-7">
                <span className="text-[11px] uppercase tracking-[0.2em] text-faint">
                    {mode === 'daily' ? format(s.finished, { date: formatDayKey(today, lang) }) : s.freeFinished}
                </span>
                <div className="tnum mt-2 text-6xl font-bold text-gold">{state.score}</div>
                <p className="mt-1 text-sm text-muted">
                    {format(s.recap, { rounds, cards: plural(lang, state.removed.length, s.cards) })}
                </p>
                {rank !== null && (
                    <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/12 px-4 py-1.5 text-sm font-semibold text-gold-soft">
                        <Trophy size={15} aria-hidden /> {format(s.rank, { n: rank })}
                    </p>
                )}
            </div>

            {!ranked ? (
                <p className="rounded-xl border border-line bg-surface/50 px-4 py-3 text-center text-sm text-muted">
                    {s.unranked}
                </p>
            ) : status !== 'sent' ? (
                <form
                    className="flex flex-col gap-2 sm:flex-row"
                    onSubmit={(e) => { e.preventDefault(); void submit(); }}
                >
                    <input
                        value={name}
                        onChange={(e) => setTyped(e.target.value)}
                        placeholder={s.namePlaceholder}
                        maxLength={20}
                        minLength={2}
                        required
                        aria-label={s.nameLabel}
                        className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-faint focus:border-brand/60"
                    />
                    <button
                        type="submit"
                        disabled={status === 'sending' || name.trim().length < 2}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-brand/45 bg-brand/15 px-5 py-3 text-sm font-semibold text-brand-soft transition enabled:hover:bg-brand/25 disabled:opacity-40"
                    >
                        {status === 'sending' && <Loader2 size={15} className="animate-spin" aria-hidden />}
                        {s.submit}
                    </button>
                </form>
            ) : (
                <p className="rounded-xl border border-success/35 bg-success/10 px-4 py-3 text-center text-sm text-success">
                    {s.saved} {message}
                </p>
            )}

            {status === 'error' && (
                <p className="rounded-xl border border-danger/35 bg-danger/10 px-4 py-3 text-center text-sm text-danger">
                    {message}
                </p>
            )}

            <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={share}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm text-muted transition hover:border-line-hi hover:text-text"
                >
                    {copied ? <Check size={15} aria-hidden /> : <Share2 size={15} aria-hidden />}
                    {copied ? s.shared : s.share}
                </button>
                <button
                    type="button"
                    onClick={onReplay}
                    className="rounded-xl border border-gold/40 bg-gold/12 px-4 py-3 text-sm font-semibold text-gold-soft transition hover:bg-gold/20"
                >
                    {s.replay}
                </button>
            </div>

            {mode === 'daily' && countdown && (
                <p className="text-center text-xs text-faint">
                    {format(s.nextDeck, { time: countdown })}
                </p>
            )}

            <section className="rounded-2xl border border-line bg-surface/40 p-4">
                <h2 className="mb-3 text-xs uppercase tracking-[0.18em] text-faint">
                    {mode === 'daily' ? s.boardDaily : s.boardFree}
                </h2>
                {board === null ? (
                    <p className="text-sm text-faint">{s.boardLoading}</p>
                ) : board.length === 0 ? (
                    <p className="text-sm text-faint">{s.boardEmpty}</p>
                ) : (
                    <ol className="flex flex-col gap-1">
                        {board.map((entry, i) => (
                            <li
                                key={`${entry.name}-${i}`}
                                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm odd:bg-tint"
                            >
                                <span className="flex items-center gap-3">
                                    <span className={`tnum w-5 text-right ${i === 0 ? 'text-gold' : 'text-faint'}`}>{i + 1}</span>
                                    <span>{entry.name}</span>
                                </span>
                                <span className="tnum font-semibold">{entry.score}</span>
                            </li>
                        ))}
                    </ol>
                )}
            </section>
        </div>
    );
}
