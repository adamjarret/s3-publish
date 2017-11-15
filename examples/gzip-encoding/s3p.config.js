/*
 * Rules can be defined for special handling of origin files with Keys matching a given pattern
 */

// RegEx pattern that matches file Keys ending in .gz
const reGzip = /\.gz$/;

module.exports = {

    // AWS region (default: 'us-east-1')
    region: 'us-east-1',

    // Path to directory containing files to be synced (default: current working directory)
    origin: '~/Desktop/s3p-test/www',

    // URI to S3 bucket where files will be uploaded
    destination: 's3://s3p-test',

    // Delete files from destination that do not exist in origin (default: false)
    delete: true,

    // Ignore hidden files and files in hidden directories (default: undefined)
    ignore: /^\.|\/\./,

    // Special handling rules for file Keys that match a given pattern
    rules: [{

        // Rule only applies to origin files with Keys that match the pattern
        pattern: reGzip,

        // Remove .gz extension from destination key (ex: A.txt.gz will be uploaded as A.txt)
        // Note: The alternateKey value (if specified) is used to determine the ContentType param sent with the S3
        //   put request (ex. A.txt.gz will be uploaded with mime type "text/plain")
        alternateKey: (file, key, callback) => callback(null, key.replace(reGzip, '')),

        // Specify content encoding mechanism for compressed files
        putParams: (file, params, callback) => callback(null, Object.assign(params, {ContentEncoding: 'gzip'}))
    }]
};

module.exports.schemaVersion = 1;