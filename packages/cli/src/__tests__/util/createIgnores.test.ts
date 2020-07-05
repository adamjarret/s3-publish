import { File } from '@s3-publish/core';
import { MockProvider } from '@s3-publish/core/lib/__mock__/MockProvider';
import { createIgnores } from '../../util/createIgnores';
import { A, B, C } from '../__fixtures__/files';

const provider = new MockProvider({
  root: './public',
  files: [A, B, C]
});

test('createIgnores', () => {
  const result = createIgnores(['*.md']);
  if (!result) {
    throw new Error('Failed to create ignores function');
  }

  expect(result(provider.files.get(A.Key) as File)).toEqual(false);
  expect(result(provider.files.get(C.Key) as File)).toEqual(true);
});

test('createIgnores: negate', () => {
  const result = createIgnores(['*.txt', '!A.txt']);
  if (!result) {
    throw new Error('Failed to create ignores function');
  }

  expect(result(provider.files.get(A.Key) as File)).toEqual(false);
  expect(result(provider.files.get(B.Key) as File)).toEqual(true);
});

test('createIgnores: empty', () => {
  const result = createIgnores([]);
  expect(result).toBeUndefined();
});

test('createIgnores: undefined', () => {
  const result = createIgnores();
  expect(result).toBeUndefined();
});
