/** Splits pre-cleaned note text (see scripts/import-apkg.mjs) into display lines. */
export function splitLines(text: string | null): string[] {
  if (!text) return []
  return text.split('\n').filter((line) => line.trim().length > 0)
}
