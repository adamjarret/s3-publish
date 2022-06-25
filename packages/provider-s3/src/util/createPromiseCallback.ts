/**
 * Return a callback that resolves if no error is present or rejects.
 * @internal
 */
export function createPromiseCallback<T>(
  resolve: (result: T) => void,
  reject: (result: Error) => void
) {
  return (error: Error | null, result: T): void => {
    if (error) {
      reject(error);
    } else {
      resolve(result);
    }
  };
}
