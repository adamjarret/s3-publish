const re = /s3:\/\/([^/]+)\/?(.*)\/?/i;

exports.isS3Uri = (s3Uri) => !s3Uri ? false : s3Uri.match(re);

exports.splitS3Uri = (s3Uri) => {
    const matches = exports.isS3Uri(s3Uri);
    return !matches ? null : {
        Bucket: matches[1],
        Prefix: matches[2]
    };
};