import type { Metadata } from 'next';
import { RulesView } from '@/views/RulesView';
import { pageMetadata } from '@/lib/metadata';
import { dict } from '@/i18n/dictionary';

const LOCALE = 'fr' as const;
const t = dict(LOCALE);

export const metadata: Metadata = pageMetadata({
    locale: LOCALE,
    key: 'rules',
    title: t.rules.title,
    description: t.rules.description,
});

export default function Page() {
    return <RulesView locale={LOCALE} />;
}
