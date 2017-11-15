const path = require('path');
const expandTilde = require('expand-tilde');
const {isS3Uri} = require('../lib/s3Uri');

exports.standardizePath = (filePath) => isS3Uri(filePath) ? filePath : (
    !filePath ? null : path.resolve(expandTilde(filePath))
);
