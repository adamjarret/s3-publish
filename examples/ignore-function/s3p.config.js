/*
 * A function can be specified as the ignore opt (instead of a regex pattern) for complex/asynchronous matching.
 */

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
    ignore: (file, callback) => callback(null, file.Key.startsWith('.') || file.Key.indexOf('/.') > 0 )
};

module.exports.schemaVersion = 1;