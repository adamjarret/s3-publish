const fs = require('fs');
const path = require('path');
const mime = require('mime');
const {splitS3Uri} = require('../lib/s3Uri');
const {S3} = require('../vendor/aws-sdk');
const {ADDED, CHANGED, DELETED} = require('../constants/status');

module.exports = (cfg, file, status, preview, progress, callback) => {

    const s3 = new S3();
    const {opts: {origin, destination, acl, debug}, putParams} = cfg;
    const {Key, DestinationKey, Size, ETag} = file;
    const destinationKey = DestinationKey || Key;
    const uriParts = splitS3Uri(destination);
    const params = {
        Bucket: uriParts.Bucket,
        Key: path.join(uriParts.Prefix, destinationKey).replace(/\\/g, '/') // Normalize Windows path separator
    };

    function maybeDebug(action)
    {
        if (debug) {
            console.log('%s %s %s', action, Key, JSON.stringify(params, (k, v) => {
                return k === 'Body' ? v.path : v;
            }, 4));
        }
    }

    if (status === ADDED || status === CHANGED) {

        Object.assign(params, {
            Body: fs.createReadStream(path.join(origin, Key)),
            ContentType: mime.getType(destinationKey),
            ContentLength: Size,
            ContentMD5: new Buffer(ETag.replace(/"/g, ''), 'hex').toString('base64')
        });

        return putParams(file, params, (err, p) => {

            // If err or putParams calls back with a falsy params value, skip S3 call
            if (err || !p) { return callback(err); }

            // Indicate if Bucket param has been altered in operation description
            const to = p.Bucket === uriParts.Bucket ? p.Key : `s3://${p.Bucket}/${p.Key}`;

            // If preview, skip S3 call (but simulate action by calling back with would-be values)
            if (preview) {

                // If debug, output params
                maybeDebug('PUT');

                return callback(null, to, Key);
            }

            // Call putObject (or putObjectAcl if acl is true) with params
            //  then callback with origin key and destination key
            let loadedBytes = 0;
            s3[acl ? 'putObjectAcl' : 'putObject'](p, (e, result) => {
                callback(e || (result.ETag !== ETag ? 'Integrity check failed' : null), to, Key);
            }).on('httpUploadProgress', ({loaded}) => {
                progress && progress(loaded - loadedBytes);
                loadedBytes = loaded;
            });
        });
    }

    if (status === DELETED) {

        // If preview, skip S3 call (but simulate action by calling back with would-be values)
        if (preview) {

            // If debug, output params
            maybeDebug('DELETE');

            return callback(null, Key);
        }

        return s3.deleteObject(params, (err) => callback(err, Key));
    }

    callback();
};