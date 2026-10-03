import { getKnowledgeEntries, KnowledgeEntrySchema, type KnowledgeEntry } from './store';

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? [];
}

export function bm25Search(query: string, locale: 'en' | 'mr' | 'hi', limit = 5, entries = getKnowledgeEntries(locale)): KnowledgeEntry[] {
  const terms = [...new Set(tokenize(query))];
  if (!terms.length) return [];
  const corpus = entries.map((entry) => ({ entry: KnowledgeEntrySchema.parse(entry), tokens: tokenize(`${entry.title} ${entry.body}`) }));
  const avgLength = corpus.reduce((sum, document) => sum + document.tokens.length, 0) / Math.max(corpus.length, 1);
  const scored = corpus.map(({ entry, tokens }) => {
    const lengthNorm = 1.2 * (1 - .75 + .75 * tokens.length / Math.max(avgLength, 1));
    const score = terms.reduce((total, term) => {
      const frequency = tokens.filter((token) => token === term).length;
      const docFreq = corpus.filter((doc) => doc.tokens.includes(term)).length;
      const inverse = Math.log(1 + (corpus.length - docFreq + .5) / (docFreq + .5));
      return total + inverse * (frequency * 2.2) / (frequency + lengthNorm);
    }, 0);
    return { entry, score };
  });
  return scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((item) => item.entry);
}