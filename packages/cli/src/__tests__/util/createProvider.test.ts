import { createProvider } from '../../util/createProvider';

test('createProvider: FS', () => {
  const result = createProvider({ root: '.' });
  expect(result.protocol).toEqual('file');
});

test('createProvider: S3', () => {
  const result = createProvider({ root: 's3://s3p-test' });
  expect(result.protocol).toEqual('s3');
});
