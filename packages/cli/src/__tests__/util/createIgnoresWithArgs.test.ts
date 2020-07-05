import path from 'path';
import { MockProvider } from '@s3-publish/core/lib/__mock__/MockProvider';
import { createIgnoresWithArgs } from '../../util/createIgnoresWithArgs';

const SourceProvider = new MockProvider({
  root: './public',
  files: []
});

const testIgnoreFile = path.resolve(__dirname, '..', '__fixtures__', 's3p.test.ignore');

test('createIgnoresWithArgs: ignore file', () => {
  const args = { _: [], originIgnorePath: testIgnoreFile };
  const result = createIgnoresWithArgs('origin', args, {});
  if (!result) {
    throw new Error('Failed to create ignores function');
  }

  expect(result({ Key: 'B.txt', SourceProvider })).toEqual(false);
  expect(result({ Key: 'A.txt', SourceProvider })).toEqual(true);
});
