import { normalizeSeparators } from '../../util/normalizeSeparators';

test('normalizeSeparators: mixed', () => {
  const result = normalizeSeparators('a/b\\c\\d');
  expect(result).toBe('a/b/c/d');
});

test('normalizeSeparators: windows path', () => {
  const result = normalizeSeparators('C:\\a\\b\\c\\d');
  expect(result).toBe('C:/a/b/c/d');
});

test('normalizeSeparators: S3 URI', () => {
  const result = normalizeSeparators('s3://bucket/prefix');
  expect(result).toBe('s3://bucket/prefix');
});

test('normalizeSeparators: S3 URI (trailing slash)', () => {
  const result = normalizeSeparators('s3://bucket/prefix/');
  expect(result).toBe('s3://bucket/prefix/');
});
