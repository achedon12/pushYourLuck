import type { Metadata } from 'next';
import { ChangelogView } from '@/views/ChangelogView';
import { pageMetadata } from '@/lib/metadata';
import { dict } from '@/i18n/dictionary';

const LOCALE = 'fr' as const;
const t = dict(LOCALE);

export const metadata: Metadata = pageMetadata({
    locale: LOCALE,
    key: 'changelog',
    title: t.changelog.title,
    description: t.changelog.description,
});

export default function Page() {
    return <ChangelogView locale={LOCALE} />;
}
