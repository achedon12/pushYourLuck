import type { Metadata } from 'next';
import { LegalView } from '@/views/LegalView';
import { pageMetadata } from '@/lib/metadata';
import { dict } from '@/i18n/dictionary';

const LOCALE = 'en' as const;
const t = dict(LOCALE);

export const metadata: Metadata = pageMetadata({
    locale: LOCALE,
    key: 'legal',
    title: t.legal.title,
    description: t.legal.description,
});

export default function Page() {
    return <LegalView locale={LOCALE} />;
}
