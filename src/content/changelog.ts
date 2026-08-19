/**
 * Journal des versions.
 *
 * Les deux langues cohabitent dans la même entrée plutôt que dans les
 * dictionnaires : une note de version est une donnée qui s'empile, et garder
 * les deux textes côte à côte rend impossible d'en publier une à moitié
 * traduite.
 */
export type ChangeType = 'feature' | 'balance' | 'fix';

export interface Change {
    type: ChangeType;
    fr: string;
    en: string;
}

export interface Release {
    version: string;
    /** Format ISO, affiché dans la langue de la page. */
    date: string;
    changes: Change[];
}

export const CHANGELOG: Release[] = [
    {
        version: '1.0.0',
        date: '2026-08-19',
        changes: [
            {
                type: 'feature',
                fr: 'Première version : partie du jour commune à tous les joueurs, partie libre illimitée et classement quotidien.',
                en: 'First release: a daily deck shared by all players, unlimited free play and a daily leaderboard.',
            },
            {
                type: 'feature',
                fr: 'Boutique entre les manches — quatorze cartes, dont la Pince coupante, le Sonar et l’Assurance.',
                en: 'Shop between rounds — fourteen cards, including Wire cutters, Sonar and Insurance.',
            },
            {
                type: 'feature',
                fr: 'Les scores sont vérifiés côté serveur : la partie est rejouée depuis la graine du jour, un score inventé est refusé.',
                en: 'Scores are verified server-side: the game is replayed from the daily seed, so a made-up score is rejected.',
            },
            {
                type: 'balance',
                fr: 'Prime d’enchaînement fixée à +22 % par carte. En dessous, encaisser dès la première carte gagnait toujours ; au-dessus, pousser à l’aveugle devenait la seule stratégie.',
                en: 'Streak bonus set to +22% per card. Any lower and banking on the first card always won; any higher and pushing blindly became the only strategy.',
            },
            {
                type: 'feature',
                fr: 'Thème clair et thème sombre, site disponible en français et en anglais.',
                en: 'Light and dark themes, with the site available in French and English.',
            },
        ],
    },
];
