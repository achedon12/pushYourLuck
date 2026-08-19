/**
 * Interpolation et pluriels.
 *
 * Les dictionnaires ne contiennent QUE des chaînes, jamais de fonctions : ils
 * doivent traverser la frontière serveur → composant client, et React ne sait
 * sérialiser qu'une valeur simple. Le formatage se fait donc à l'usage.
 */
export type Vars = Record<string, string | number>;

export function format(template: string, vars: Vars = {}): string {
    return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
        key in vars ? String(vars[key]) : whole,
    );
}

export interface Plural {
    one: string;
    other: string;
}

/**
 * Le français met au singulier 0 ET 1 (« 0 manche », « 1 manche »), l'anglais
 * seulement 1. `Intl.PluralRules` connaît la différence, ce qui évite d'écrire
 * la règle à la main pour chaque langue ajoutée ensuite.
 */
export function plural(locale: string, count: number, forms: Plural, vars: Vars = {}): string {
    const rule = new Intl.PluralRules(locale).select(count);
    const template = rule === 'one' ? forms.one : forms.other;
    return format(template, { count, ...vars });
}
