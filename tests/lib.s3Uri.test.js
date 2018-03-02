const test = require('tape');
const {isS3Uri, splitS3Uri} = require('../src/lib/s3Uri');

test('s3Uri parser', function (t) {

    t.ok(isS3Uri('s3://s3p-test'), 'S3 URL without prefix');

    t.ok(isS3Uri('s3://s3p-test/foo'), 'S3 URL with prefix');

    t.ok(isS3Uri('s3://s3p-test/foo/bar'), 'S3 URL with multi-segment prefix');

    t.ok(isS3Uri('s3://s3p-test/foo/bar.html'), 'S3 URL with extension');

    t.ok(!isS3Uri('s3:/s3p-test/foo'), 'Malformed S3 URL');

    t.ok(!isS3Uri('s3p-test/foo'), 'Relative path');

    t.ok(!isS3Uri('/s3p-test/foo'), 'Absolute path');

    let split;

    split = splitS3Uri('s3://s3p-test');
    t.equal(split.Bucket, 's3p-test', 'Split S3 URL without prefix, check Bucket');
    t.equal(split.Prefix, '', 'Split S3 URL without prefix, check Prefix');

    split = splitS3Uri('s3://s3p-test/foo');
    t.equal(split.Bucket, 's3p-test', 'Split S3 URL with prefix, check Bucket');
    t.equal(split.Prefix, 'foo', 'Split S3 URL with prefix, check Prefix');

    split = splitS3Uri('s3://s3p-test/foo/bar');
    t.equal(split.Bucket, 's3p-test', 'Split S3 URL with multi-segment prefix, check Bucket');
    t.equal(split.Prefix, 'foo/bar', 'Split S3 URL with multi-segment prefix, check Prefix');

    split = splitS3Uri('s3://s3p-test/foo/bar.json');
    t.equal(split.Bucket, 's3p-test', 'Split S3 URL with extension, check Bucket');
    t.equal(split.Prefix, 'foo/bar.json', 'Split S3 URL with extension, check Prefix');

    t.end();
});
