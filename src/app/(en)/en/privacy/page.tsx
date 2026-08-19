import type { Metadata } from 'next';
import { PrivacyView } from '@/views/PrivacyView';
import { pageMetadata } from '@/lib/metadata';
import { dict } from '@/i18n/dictionary';

const LOCALE = 'en' as const;
const t = dict(LOCALE);

export const metadata: Metadata = pageMetadata({
    locale: LOCALE,
    key: 'privacy',
    title: t.privacy.title,
    description: t.privacy.description,
});

export default function Page() {
    return <PrivacyView locale={LOCALE} />;
}
