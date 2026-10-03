'use client';

import { useTranslations } from 'next-intl';
import { CircleAlert } from 'lucide-react';

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('Workspace');
  return <main id="main-content" className="workspace-page"><div className="workspace-wrap narrow"><section className="panel empty-state"><CircleAlert size={34} /><h1>{t('admin')}</h1><p>{t('handoff')}</p><button className="button-primary" onClick={() => reset()}>{t('continue')}</button></section></div></main>;
}