const localToS3 = require('./localToS3');
const {isS3Uri} = require('../lib/s3Uri');

const placeholder = (cfg, file, status, preview, progress, callback) => callback('Transport not implemented');

function factory({opts: {origin, destination}}) {
    const oIsS3 = isS3Uri(origin);
    const dIsS3 = isS3Uri(destination);
    return ((() => {
        if(oIsS3 && dIsS3) { return placeholder; }
        if(oIsS3 && !dIsS3) { return placeholder; }
        if(!oIsS3 && dIsS3) { return localToS3; }
        if(!oIsS3 && !dIsS3) { return placeholder; }
    })()).apply(null, arguments);
}

factory.localToS3 = localToS3;

module.exports = factory;
