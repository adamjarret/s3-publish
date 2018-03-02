const test = require('tape');
const s3Source = require('../src/sources/s3');
const mockBucket = require('./mock-responses/list-bucket.json');
const mockBucketSub = require('./mock-responses/list-bucket-sub.json');

test('Source: S3 (no prefix)', function (t) {

    // 1 response object will be ignored (/public, and empty folder) so adjust plan accordingly
    t.plan(mockBucket.Contents.length - 1);

    // Create a queue object with concurrency of 1 (callback will be called for each file listed)
    const q = s3Source.q((file, next) => {
        t.ok(!file.Key.match(/^\//), 'Key should not begin with /');
        next();
    });

    // Add listed files to the queue
    q.push(mockBucket.Contents);

});

test('Source: S3 ("sub" prefix)', function (t) {

    t.plan(mockBucketSub.Contents.length * 2);

    // Create a queue object with concurrency of 1 (callback will be called for each file listed)
    const q = s3Source.q((file, next) => {
        t.ok(!file.Key.match(/^\//), 'Key should not begin with /');
        t.ok(!file.Key.match(/^sub/), 'Key should be relative');
        next();
    }, 'sub');

    // Add listed files to the queue
    q.push(mockBucketSub.Contents);

});
