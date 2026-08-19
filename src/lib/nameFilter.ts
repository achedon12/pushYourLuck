/**
 * Filtre des pseudos du classement.
 *
 * Le classement est la seule zone du site où un visiteur publie du texte visible
 * par tous, sans compte ni modération a posteriori. Le filtre est donc appliqué
 * côté SERVEUR, au moment de l'enregistrement : un contrôle côté navigateur
 * serait contourné par un simple appel direct à l'API.
 *
 * ── Le compromis à connaître ───────────────────────────────────────────────
 * Chercher un mot interdit N'IMPORTE OÙ dans la chaîne attrape les tentatives
 * de contournement (« xxputexx ») mais casse des pseudos légitimes : « con »
 * dans « Connor », « ass » dans « Cassandra ». D'où deux listes séparées :
 *   - WORDS     : recherché comme MOT entier (mots courts, ambigus) ;
 *   - FRAGMENTS : recherché n'importe où (termes longs et sans ambiguïté).
 * Ne déplace pas un terme de WORDS vers FRAGMENTS sans vérifier qu'il n'est
 * contenu dans aucun prénom courant.
 */

/** Table de désobfuscation : « p4ssw0rd » et « passworD » doivent se valoir. */
const LEET: Record<string, string> = {
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '6': 'g',
    '7': 't', '8': 'b', '9': 'g', '@': 'a', '$': 's', '!': 'i',
    '+': 't', '(': 'c', '€': 'e', '£': 'l',
};

/**
 * Ramène un pseudo à une forme comparable : minuscules, sans accents, sans
 * décoration et chiffres-substituts résolus.
 */
export function normalizeName(raw: string): string {
    return raw
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .split('')
        .map((char) => LEET[char] ?? char)
        .join('')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

/**
 * Écrase les répétitions : « fuuuuck » et « fuck » deviennent la même chaîne.
 *
 * Appliqué des DEUX côtés de la comparaison — au pseudo comme aux termes de la
 * liste — sans quoi « ass » réduit à « as » ne correspondrait plus à rien.
 */
const collapse = (value: string) => value.replace(/(.)\1+/g, '$1');

/**
 * Recolle les suites de caractères isolés : « f u c k » et « F.U.C.K » sont des
 * contournements classiques, que la découpe en mots laissait passer.
 */
function joinSpelledOut(normalized: string): string {
    const tokens = normalized.split(' ').filter(Boolean);
    const out: string[] = [];
    let run: string[] = [];

    const flush = () => {
        if (run.length > 1) out.push(run.join(''));
        else if (run.length === 1) out.push(run[0]);
        run = [];
    };

    for (const token of tokens) {
        if (token.length === 1) run.push(token);
        else { flush(); out.push(token); }
    }
    flush();

    return out.join(' ');
}

/** Termes réservés : ils feraient passer un joueur pour le site ou son équipe. */
const RESERVED = [
    'admin', 'administrateur', 'administrator', 'moderateur', 'moderator', 'modo',
    'staff', 'support', 'systeme', 'system', 'root', 'sysadmin', 'webmaster',
    'owner', 'proprietaire', 'officiel', 'official', 'bot', 'robot', 'server',
    'serveur', 'anonymous', 'anonyme', 'null', 'undefined', 'nan', 'none',
    'push your luck', 'pushyourluck', 'leoderoin', 'loupsgarous',
];

/** Injections et charges techniques : rien de tout ça n'est un pseudo. */
const TECHNICAL = [
    'script', 'javascript', 'onerror', 'onload', 'alert', 'select from',
    'drop table', 'insert into', 'union select', 'http', 'www', 'href',
];

/**
 * Termes recherchés comme MOTS ENTIERS. Injures et termes sexuels courts,
 * français et anglais, dont les lettres se retrouvent dans des prénoms.
 */
const WORDS = [
    // français
    'con', 'cons', 'conne', 'connes', 'cul', 'bite', 'bites', 'couille', 'couilles',
    'chatte', 'chattes', 'nichon', 'nichons', 'salope', 'salopes', 'salaud', 'salauds',
    'pute', 'putes', 'putain', 'putains', 'merde', 'merdes', 'chier', 'chiotte',
    'enfoire', 'enculer', 'enculee', 'branler', 'branleur', 'baiser', 'baise',
    'nique', 'niquer', 'niquez', 'pd', 'tapette', 'gouine', 'travelo',
    'debile', 'attarde', 'mongol', 'trisomique', 'cretin', 'abruti',
    'viol', 'violer', 'violeur', 'inceste', 'pedo', 'pedophile', 'zoophile',
    'nazi', 'nazis', 'hitler', 'shoah', 'genocide', 'terroriste', 'daesh',
    'suicide', 'suicider', 'pendaison',
    // anglais
    'ass', 'arse', 'butt', 'dick', 'cock', 'cunt', 'twat', 'tits', 'boobs',
    'fuck', 'fucks', 'fucked', 'fucker', 'fucking', 'shit', 'shits', 'crap',
    'bitch', 'bitches', 'slut', 'sluts', 'whore', 'whores', 'bastard',
    'rape', 'rapist', 'incest', 'pedo', 'pedophile', 'zoophile',
    'nigga', 'nigger', 'chink', 'spic', 'kike', 'wetback', 'tranny',
    'fag', 'fags', 'faggot', 'dyke', 'queer',
    'retard', 'retarded', 'spastic', 'cripple',
    'nazi', 'nazis', 'kys', 'kill yourself', 'suicide',
    'porn', 'porno', 'xxx', 'sex', 'anal', 'blowjob', 'handjob', 'cum',
    'penis', 'vagina', 'boner', 'jerkoff', 'masturbate',
];

/**
 * Termes recherchés N'IMPORTE OÙ dans la chaîne. Uniquement des suites de
 * lettres qui n'apparaissent dans aucun prénom ou mot courant, donc sûres à
 * traquer même collées à d'autres caractères.
 */
const FRAGMENTS = [
    'connard', 'connasse', 'encule', 'batard', 'fdp', 'ntm', 'tgueule', 'ferme ta',
    'putain', 'salopard', 'trouduc', 'suceur', 'suceuse', 'sodomi',
    'motherfucker', 'motherfucking', 'asshole', 'dumbass', 'jackass',
    'cocksucker', 'dickhead', 'shithead', 'bullshit', 'goatse', 'hentai',
    'nigger', 'niggas', 'faggot', 'holocaust', 'heilhitler', 'siegheil',
    'childporn', 'cp4nz', 'lolicon', 'shotacon', 'bestiality',
];

export type NameVerdict = { ok: true } | { ok: false; reason: 'too_short' | 'blocked' };

/**
 * Le pseudo est-il publiable ?
 *
 * Le filtre n'a pas vocation à être infaillible — aucun ne l'est — mais à
 * arrêter ce qui arrive sans effort : l'insulte tapée telle quelle, sa variante
 * en chiffres, et l'usurpation d'identité du site.
 */
/**
 * Chaque terme est comparé sous deux formes : telle quelle, et répétitions
 * écrasées. La forme écrasée n'est retenue qu'à partir de trois caractères,
 * sans quoi « xxx » se réduirait à « x » et bannirait tous les « xX_Pseudo_Xx ».
 */
interface Term {
    raw: string;
    collapsed: string | null;
}

const toTerm = (term: string): Term => {
    const raw = term.replace(/ /g, '');
    const collapsed = collapse(raw);
    return { raw, collapsed: collapsed.length >= 3 && collapsed !== raw ? collapsed : null };
};

const RESERVED_TERMS = RESERVED.map(toTerm);
const ANYWHERE_TERMS = [...TECHNICAL, ...FRAGMENTS, ...WORDS.filter((w) => w.includes(' '))].map(toTerm);
const WORD_TERMS = WORDS.filter((w) => !w.includes(' ')).map(toTerm);

export function checkName(raw: string): NameVerdict {
    const normalized = normalizeName(raw);
    if (normalized.replace(/[^a-z0-9]/g, '').length < 2) return { ok: false, reason: 'too_short' };

    const spelled = joinSpelledOut(normalized);
    const compact = spelled.replace(/ /g, '');
    const compactCollapsed = collapse(compact);
    const words = spelled.split(' ').filter(Boolean);
    const wordsCollapsed = words.map(collapse);

    // La forme écrasée du pseudo est confrontée à la forme BRUTE du terme : un
    // terme sans lettre doublée ne change pas en s'écrasant, et c'est ce qui
    // permet à « fuuuuck » de retomber sur « fuck ».
    const containedIn = (term: Term) =>
        compact.includes(term.raw) ||
        compactCollapsed.includes(term.raw) ||
        (term.collapsed !== null && compactCollapsed.includes(term.collapsed));

    const isWord = (term: Term) =>
        words.includes(term.raw) ||
        wordsCollapsed.includes(term.raw) ||
        (term.collapsed !== null && wordsCollapsed.includes(term.collapsed));

    if (RESERVED_TERMS.some((term) => compact === term.raw || isWord(term))) {
        return { ok: false, reason: 'blocked' };
    }
    if (ANYWHERE_TERMS.some(containedIn)) return { ok: false, reason: 'blocked' };
    if (WORD_TERMS.some(isWord)) return { ok: false, reason: 'blocked' };

    return { ok: true };
}
