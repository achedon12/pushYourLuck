import type { Metadata } from 'next';
import { HomeView } from '@/views/HomeView';
import { pageMetadata } from '@/lib/metadata';
import { dict } from '@/i18n/dictionary';

const LOCALE = 'en' as const;
const t = dict(LOCALE);

export const metadata: Metadata = pageMetadata({
    locale: LOCALE,
    key: 'home',
    title: t.home.title,
    description: t.site.description,
});

export default function Page() {
    return <HomeView locale={LOCALE} />;
}
