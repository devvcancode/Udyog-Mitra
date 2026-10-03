import { z } from 'zod';
import { approvals, knowledgeArticles, type LocaleText } from '@/lib/demo-data';

export const KnowledgeEntrySchema = z.object({ id: z.string(), title: z.string(), body: z.string(), locale: z.enum(['en', 'mr', 'hi']), source: z.string(), version: z.string() }).strict();
export type KnowledgeEntry = z.infer<typeof KnowledgeEntrySchema>;

export function getKnowledgeEntries(locale: 'en' | 'mr' | 'hi'): KnowledgeEntry[] {
  const articles = knowledgeArticles.map((article) => KnowledgeEntrySchema.parse({
    id: article.slug, title: article.title[locale], body: `${article.title[locale]} ${article.category} ${article.tags.join(' ')}`,
    locale, source: `knowledge:${article.slug}`, version: 'illustrative-seed-2026-10',
  }));
  const approvalEntries = approvals.map((approval) => KnowledgeEntrySchema.parse({
    id: `approval:${approval.id}`, title: approval.name[locale], body: `${approval.name[locale]} ${approval.department} ${approval.stage} ${approval.tags.join(' ')} ${approval.documents[0]?.[locale] ?? ''}`,
    locale, source: `approval-catalog:${approval.id}`, version: 'illustrative-seed-2026-10',
  }));
  return [...articles, ...approvalEntries];
}

export function localizeText(text: LocaleText, locale: 'en' | 'mr' | 'hi'): string { return text[locale]; }