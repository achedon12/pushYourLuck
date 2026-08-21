/**
 * Un record par pseudo, pour le tableau des parties libres.
 *
 * En mode libre l'unicité en base porte sur le `clientId` — un joueur qui
 * change de navigateur, ou deux personnes ayant choisi le même pseudo,
 * occupent autant de lignes. Le tableau affichait donc le même pseudo deux ou
 * trois fois d'affilée : ça se lit comme un bug, et ça prend la place des
 * autres joueurs alors que la section s'annonce comme des « records ».
 *
 * La comparaison ignore la casse et les espaces de bord : « Leo » et « leo »
 * sont le même pseudo pour qui lit la page, donc doivent l'être ici aussi.
 *
 * L'entrée doit DÉJÀ être triée, meilleur d'abord : la première ligne
 * rencontrée pour un pseudo est celle qu'on garde. Le tri reste ainsi au SGBD,
 * qui a l'index pour le faire.
 */
export function bestPerName<T extends { name: string }>(rows: readonly T[], limit: number): T[] {
    const seen = new Set<string>();
    const best: T[] = [];

    for (const row of rows) {
        if (best.length >= limit) break;
        const key = row.name.trim().toLocaleLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        best.push(row);
    }

    return best;
}

/**
 * Marge de lecture : il faut lire plus de lignes qu'on n'en affiche, sinon un
 * joueur qui truste les dix premières places laisse un tableau d'une seule
 * ligne. Vingt fois la taille du tableau absorbe même un cas pathologique.
 */
export function scanSize(limit: number): number {
    return Math.min(2000, limit * 20);
}
