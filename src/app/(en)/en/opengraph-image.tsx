// Ce fichier vit sous le segment `/en`, et non à la racine du groupe `(en)` :
// les deux groupes de routes se résolvent tous deux sur `/`, si bien que leurs
// images de partage entraient en collision et que les pages anglaises se
// retrouvaient sans aucune balise og:image.
import { ogImage, OG_SIZE } from '@/lib/ogImage';
import { dict } from '@/i18n/dictionary';

const t = dict('en');

export const alt = `${t.site.name} — ${t.site.tagline}`;
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function OpenGraphImage() {
    return ogImage('en');
}
