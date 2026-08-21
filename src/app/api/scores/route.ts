import { prisma } from '@/lib/prisma';
import { dayKey, dailySeed } from '@/lib/daily';
import { replay } from '@/games/push-your-luck/replay';
import { checkName } from '@/lib/nameFilter';
import { RateLimiter, clientKey } from '@/lib/rateLimit';
import { isTrustedOrigin } from '@/lib/origin';
import { bestPerName, scanSize } from '@/lib/records';

export const dynamic = 'force-dynamic';

const GAME = 'push-your-luck';

/**
 * Une partie complète dure au minimum une poignée de secondes : vingt envois
 * par quart d'heure laissent largement respirer un joueur en mode libre, tout
 * en rendant l'inondation du classement inopérante.
 */
const submitLimiter = new RateLimiter(20, 15 * 60 * 1000);

/**
 * La taille du corps est bornée AVANT lecture : `MAX_ACTIONS` protège le
 * rejeu, pas la mémoire consommée à l'analyse d'un corps de plusieurs mégaoctets.
 * 16 ko couvrent très largement la plus longue partie possible.
 */
const MAX_BODY_BYTES = 16 * 1024;
const MODES = ['daily', 'free'] as const;
type Mode = (typeof MODES)[number];

/** Classement. `?mode=daily|free&day=YYYY-MM-DD&limit=n` */
export async function GET(request: Request) {
    const params = new URL(request.url).searchParams;
    const mode = (params.get('mode') ?? 'daily') as Mode;
    if (!MODES.includes(mode)) return Response.json({ error: 'invalid_mode' }, { status: 400 });

    const day = mode === 'daily' ? (params.get('day') ?? dayKey()) : '';
    const limit = Math.min(100, Math.max(1, Number(params.get('limit') ?? 20)));

    const rows = await prisma.score.findMany({
        where: { game: GAME, mode, dayKey: day },
        orderBy: [{ score: 'desc' }, { rounds: 'asc' }, { createdAt: 'asc' }],
        // En mode libre l'unicité en base porte sur le clientId : un même
        // pseudo peut occuper plusieurs lignes, et les records n'en gardent
        // qu'une. Il faut donc lire plus de lignes qu'on n'en rendra.
        take: mode === 'free' ? scanSize(limit) : limit,
        select: { name: true, score: true, rounds: true, createdAt: true },
    });

    // Le classement du jour, lui, garde ses doublons de pseudo : deux joueurs
    // qui choisissent le même nom ont chacun droit à leur ligne du jour.
    const scores = mode === 'free' ? bestPerName(rows, limit) : rows;

    return Response.json({ mode, day, scores });
}

interface SubmitBody {
    mode?: string;
    name?: string;
    clientId?: string;
    actions?: string;
    /** Requis en mode libre uniquement : en mode quotidien la graine est imposée. */
    seed?: number;
}

export async function POST(request: Request) {
    // Avant la limitation de débit : ce contrôle ne lit qu'un en-tête et ne
    // touche à aucun compteur partagé, donc un refus ne coûte rien et ne
    // consomme pas le quota d'un tiers.
    if (!isTrustedOrigin(request)) {
        return Response.json({ error: 'forbidden_origin' }, { status: 403 });
    }

    const limit = submitLimiter.check(clientKey(request));
    if (!limit.allowed) {
        return Response.json(
            { error: 'too_many_requests' },
            { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
        );
    }

    const declared = Number(request.headers.get('content-length') ?? 0);
    if (declared > MAX_BODY_BYTES) {
        return Response.json({ error: 'payload_too_large' }, { status: 413 });
    }

    let body: SubmitBody;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'invalid_body' }, { status: 400 });
    }

    const mode = (body.mode ?? 'daily') as Mode;
    if (!MODES.includes(mode)) return Response.json({ error: 'invalid_mode' }, { status: 400 });

    const name = cleanName(body.name);
    if (!name) return Response.json({ error: 'invalid_name' }, { status: 400 });

    // Le filtre tourne côté serveur : un contrôle côté navigateur serait
    // contourné par un appel direct à cette route.
    const verdict = checkName(name);
    if (!verdict.ok) {
        return Response.json(
            { error: verdict.reason === 'too_short' ? 'invalid_name' : 'blocked_name' },
            { status: 422 },
        );
    }

    const clientId = String(body.clientId ?? '').slice(0, 64);
    if (clientId.length < 8) return Response.json({ error: 'invalid_client' }, { status: 400 });

    const actions = String(body.actions ?? '');
    const day = mode === 'daily' ? dayKey() : '';
    const seed = mode === 'daily' ? dailySeed(day) : Number(body.seed);
    if (!Number.isInteger(seed)) return Response.json({ error: 'invalid_seed' }, { status: 400 });

    // Le score n'est jamais lu depuis la requête : il est recalculé en rejouant
    // les actions. Voir replay.ts.
    const result = replay(seed >>> 0, actions);
    // La raison précise du rejet n'est pas renvoyée : elle indiquerait à qui
    // fabrique une partie où sa suite d'actions a cloché.
    if (!result.ok) return Response.json({ error: 'replay_rejected' }, { status: 422 });

    const { score, round } = result.state;

    const existing = await prisma.score.findUnique({
        where: { one_score_per_day: { game: GAME, mode, dayKey: day, clientId } },
        select: { score: true },
    });

    if (existing && existing.score >= score) {
        return Response.json({ saved: false, score, best: existing.score });
    }

    await prisma.score.upsert({
        where: { one_score_per_day: { game: GAME, mode, dayKey: day, clientId } },
        create: { game: GAME, mode, dayKey: day, clientId, name, score, rounds: round },
        update: { name, score, rounds: round },
    });

    const rank = await prisma.score.count({
        where: { game: GAME, mode, dayKey: day, score: { gt: score } },
    });

    return Response.json({ saved: true, score, rank: rank + 1 });
}

/**
 * Les pseudos sont affichés tels quels dans le classement : on borne les
 * caractères plutôt que d'échapper à l'affichage, pour qu'aucune séquence
 * bizarre n'entre en base.
 */
function cleanName(raw: unknown): string | null {
    // Un type non textuel est refusé plutôt que converti : `String({})` donne
    // « [object Object] », qui franchissait le filtre sans rien vouloir dire.
    if (typeof raw !== 'string') return null;
    const name = raw.trim().replace(/[^\p{L}\p{N} _.'-]/gu, '').slice(0, 20);
    return name.length >= 2 ? name : null;
}
