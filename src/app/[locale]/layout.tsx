import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { SaathiWidget } from '@/components/saathi-widget';
import { AuthProvider } from '@/components/auth-provider';
import { PwaRegister } from '@/components/pwa-register';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Udyog Mitra | Maharashtra Industry Portal (Prototype)',
  description: 'A multilingual single-window prototype for industrial approvals and compliance in Maharashtra.',
  applicationName: 'Udyog Mitra',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Udyog Mitra' },
  icons: { icon: '/udyog-mitra-icon.svg', apple: '/udyog-mitra-icon.svg' },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
          <a className="skip-link" href="#main-content">{messages.Common.skip}</a>
          <PortalHeader />
          {children}
          <SaathiWidget />
          <PortalFooter />
          <PwaRegister />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}