import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export default async function NotFound() {
  const t = await getTranslations('Workspace');
  return <main id="main-content" className="workspace-page"><div className="workspace-wrap narrow"><section className="panel empty-state"><span className="section-kicker">UDYOG MITRA · PROTOTYPE</span><h1>404</h1><p>{t('noRecords')}</p><Link className="button-primary" href="/"><ArrowLeft size={16} />{t('backHome')}</Link></section></div></main>;
}