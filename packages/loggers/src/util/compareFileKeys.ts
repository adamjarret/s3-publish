/** @see {@linkcode compareKeys} */
export type KeySource = { Key?: string };

/** @see {@linkcode compareFileKeys} */
export type FileSource = { file: KeySource };

/**
 * Compares two {@linkcode File}-like objects by `Key`
 */
export function compareKeys(a: KeySource, b: KeySource): number {
  return (a.Key ?? '').localeCompare(b.Key ?? '');
}

/**
 * Compares two objects with {@linkcode File}-like properties by `Key`
 */
export function compareFileKeys(a: FileSource, b: FileSource): number {
  return compareKeys(a.file, b.file);
}
