export const CANONICAL_POSTURES: string[];
export function extractPostures(source: string): string[];
export function compareVocabulary(plane: string, postures: string[], canonical?: string[]): { plane: string; ok: boolean; unknown: string[]; missing: string[] };
