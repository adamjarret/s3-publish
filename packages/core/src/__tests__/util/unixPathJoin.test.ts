import { unixPathJoin } from '../../util/unixPathJoin';

test('unixPathJoin: mixed', () => {
  const result = unixPathJoin('a/b', 'c\\d');
  expect(result).toBe('a/b/c/d');
});

test('unixPathJoin: mixed absolute', () => {
  const result = unixPathJoin('/a/b', 'c\\d');
  expect(result).toBe('/a/b/c/d');
});

test('unixPathJoin: S3 URI', () => {
  const result = unixPathJoin('s3://bucket', 'prefix');
  expect(result).toBe('s3:/bucket/prefix');
});

test('unixPathJoin: S3 URI (trailing slash)', () => {
  const result = unixPathJoin('s3://bucket/', 'prefix/');
  expect(result).toBe('s3:/bucket/prefix/');
});

test('unixPathJoin: S3 URI (mixed trailing slash)', () => {
  const result = unixPathJoin('s3://bucket/', 'prefix\\');
  expect(result).toBe('s3:/bucket/prefix/');
});
