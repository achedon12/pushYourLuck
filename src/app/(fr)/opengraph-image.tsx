import { ogImage, OG_SIZE } from '@/lib/ogImage';
import { dict } from '@/i18n/dictionary';

const t = dict('fr');

export const alt = `${t.site.name} — ${t.site.tagline}`;
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function OpenGraphImage() {
    return ogImage('fr');
}
