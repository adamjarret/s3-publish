import { parseS3Root } from '../../util/parseS3Root';

test('parseS3Root: S3 URL without prefix', () => {
  const value = 's3://s3p-test';
  const result = parseS3Root(value);
  expect(result && result.Bucket).toBe('s3p-test');
  expect(result && result.Prefix).toBe('');
});

test('parseS3Root: S3 URL without prefix (trailing slash)', () => {
  const value = 's3://s3p-test/';
  const result = parseS3Root(value);
  expect(result && result.Bucket).toBe('s3p-test');
  expect(result && result.Prefix).toBe('');
});

test('parseS3Root: S3 URL with prefix', () => {
  const value = 's3://s3p-test/foo';
  const result = parseS3Root(value);
  expect(result && result.Bucket).toBe('s3p-test');
  expect(result && result.Prefix).toBe('foo');
});

test('parseS3Root: S3 URL with prefix (trailing slash)', () => {
  const value = 's3://s3p-test/foo/';
  const result = parseS3Root(value);
  expect(result && result.Bucket).toBe('s3p-test');
  expect(result && result.Prefix).toBe('foo/');
});

test('parseS3Root: S3 URL with multi-segment prefix', () => {
  const value = 's3://s3p-test/foo/bar';
  const result = parseS3Root(value);
  expect(result && result.Bucket).toBe('s3p-test');
  expect(result && result.Prefix).toBe('foo/bar');
});

test('parseS3Root: S3 URL with multi-segment prefix (trailing slash)', () => {
  const value = 's3://s3p-test/foo/bar/';
  const result = parseS3Root(value);
  expect(result && result.Bucket).toBe('s3p-test');
  expect(result && result.Prefix).toBe('foo/bar/');
});

test('parseS3Root: S3 URL with extension', () => {
  const value = 's3://s3p-test/foo/bar.html';
  const result = parseS3Root(value);
  expect(result && result.Bucket).toBe('s3p-test');
  expect(result && result.Prefix).toBe('foo/bar.html');
});

test('parseS3Root: S3 URL with extension and multi-segment prefix', () => {
  const value = 's3://s3p-test/foo/bar/baz.html';
  const result = parseS3Root(value);
  expect(result && result.Bucket).toBe('s3p-test');
  expect(result && result.Prefix).toBe('foo/bar/baz.html');
});

test('parseS3Root: Malformed S3 URL', () => {
  expect(parseS3Root('s3:/s3p-test/foo')).toBeNull();
});

test('parseS3Root: Relative path', () => {
  expect(parseS3Root('s3p-test/foo')).toBeNull();
});

test('parseS3Root: Absolute path', () => {
  expect(parseS3Root('/s3p-test/foo')).toBeNull();
});

test('parseS3Root: Empty', () => {
  expect(parseS3Root('')).toBeNull();
});

test('parseS3Root: null', () => {
  // @ts-ignore: parseS3Root signature does not allow `null` value for argument
  expect(parseS3Root(null)).toBeNull();
});

test('parseS3Root: undefined', () => {
  // @ts-ignore: parseS3Root signature does not allow `undefined` value for argument
  expect(parseS3Root(undefined)).toBeNull();
});

test('parseS3Root: false', () => {
  // @ts-ignore: parseS3Root signature does not allow `false` value for argument
  expect(parseS3Root(false)).toBeNull();
});

test('parseS3Root: true', () => {
  // @ts-ignore: parseS3Root signature does not allow `true` value for argument
  expect(parseS3Root(true)).toBeNull();
});
