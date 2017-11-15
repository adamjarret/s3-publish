const {queue} = require('async');
const aws = require('aws-sdk');
const {splitS3Uri} = require('../lib/s3Uri');

module.exports = (s3Uri, onFile, callback) => {

    let count = 0;

    const s3 = new aws.S3();

    // Thanks https://derickbailey.com/2016/04/13/paging-the-results-of-an-aws-s3-bucket/

    function listObjects(token, cb)
    {
        // Get Bucket and Prefix params from URI and set ContinuationToken
        const params = splitS3Uri(s3Uri);
        params.ContinuationToken = token;

        // Fetch file list
        s3.listObjectsV2(params, (err, data) => {

            // Handle error
            if (err) { return cb && cb(err); }

            // Create a queue object with concurrency of 1 (callback will be called for each file listed)
            const q = queue((file, next) => {

                //  Key values ending in a slash indicate "directories"
                if(file.Key.endsWith('/')) { return next(); }

                count++;

                onFile(file, next);
            }, 1);

            // Assign a callback for when all queue items have been processed
            q.drain = () => {
                if (data.IsTruncated) {
                    // If data is paged, fetch next page
                    listObjects(data.NextContinuationToken, cb);
                } else {
                    // If all files have been listed, callback
                    cb && cb(null, count);
                }
            };

            // Add listed files to the queue
            q.push(data.Contents);
        });
    }

    listObjects(null, callback);
};