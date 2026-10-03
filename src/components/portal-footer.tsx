import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export function PortalFooter() {
  const t = useTranslations('Footer');
  const locale = useLocale();
  const lastUpdated = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date('2026-10-03T12:00:00Z'));
  const visitors = new Intl.NumberFormat(locale).format(12480);
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-main">
          <div><Link href="/" className="footer-brand">उद्योग मित्र / Udyog Mitra</Link><p>Government of Maharashtra · Prototype</p></div>
          <nav className="footer-links" aria-label="Footer navigation">
            <Link href="/privacy">{t('privacy')}</Link><Link href="/terms">{t('terms')}</Link><Link href="/accessibility">{t('accessibility')}</Link><Link href="/sitemap">{t('sitemap')}</Link><Link href="/contact">{t('contact')}</Link><a href="https://rti.gov.in/" target="_blank" rel="noreferrer">{t('rti')}</a>
          </nav>
        </div>
        <div className="footer-bottom"><span className="footer-disclaimer">{t('disclaimer')}</span><span>{t('lastUpdated')}: {lastUpdated} · {t('visitors')}: {visitors}</span></div>
      </div>
    </footer>
  );
}