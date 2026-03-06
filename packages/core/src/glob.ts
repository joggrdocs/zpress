/**
 * Returns true if the string contains glob metacharacters.
 */
export function hasGlobChars(s: string): boolean {
  return /[*?{}[\]]/.test(s)
}
