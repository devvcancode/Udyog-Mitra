export type ConsistencyResult = { consistent: boolean; mismatches: string[]; needsHuman: true; reasonTrace: string[] };

export function compareDocumentProfiles(documents: Array<Record<string, string | number | boolean | null>>): ConsistencyResult {
  const names = documents.map((document) => document.name).filter((value): value is string => typeof value === 'string').map((value) => value.normalize('NFKC').trim().toLocaleLowerCase());
  const mismatches = names.length > 1 && new Set(names).size > 1 ? ['l3.consistency.name_mismatch_requires_human_review'] : [];
  return { consistent: mismatches.length === 0, mismatches, needsHuman: true, reasonTrace: ['l3.consistency.demo_exact_normalized_comparison_only'] };
}