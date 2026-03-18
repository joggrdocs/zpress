/**
 * Convert an unknown caught value to an Error instance.
 *
 * @param error - The unknown value from a catch clause
 * @returns An Error instance
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }
  return new Error(String(error))
}
