const local = require('./local');
const s3 = require('./s3');
const {isS3Uri} = require('../lib/s3Uri');

function factory(pathOrUri) {
    return (isS3Uri(pathOrUri) ? s3 : local).apply(null, arguments);
}

factory.local = local;
factory.s3 = s3;

module.exports = factory;
