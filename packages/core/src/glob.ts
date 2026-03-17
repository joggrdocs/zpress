/**
 * Returns true if the string contains glob metacharacters.
 *
 * @param s - String to test for glob metacharacters
 * @returns `true` if the string contains `*`, `?`, `{`, `}`, `[`, or `]`
 */
export function hasGlobChars(s: string): boolean {
  return /[*?{}[\]]/.test(s)
}
