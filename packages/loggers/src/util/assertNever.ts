/**
 * Check that argument is of type never
 * @see https://www.typescriptlang.org/docs/handbook/advanced-types.html#exhaustiveness-checking
 * @internal
 */
export function assertNever(x: never): never {
  throw new Error('Unexpected object: ' + x);
}
