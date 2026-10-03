'use client';

import { FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Search } from 'lucide-react';

export function HeroSearchForm() {
  const locale = useLocale();
  const t = useTranslations('Home');

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const business = String(new FormData(event.currentTarget).get('business') ?? '').trim();
    const query = business ? `?business=${encodeURIComponent(business)}` : '';
    window.location.assign(`/${locale}/know-your-approvals${query}`);
  }

  return <form onSubmit={search} className="hero-search">
    <Search size={19} aria-hidden="true" />
    <label className="sr-only" htmlFor="business-search">{t('searchLabel')}</label>
    <input id="business-search" name="business" placeholder={t('searchPlaceholder')} />
    <button type="submit" className="button-primary"><span className="sr-only">{t('search')}</span><ArrowRight size={19} aria-hidden="true" /></button>
  </form>;
}