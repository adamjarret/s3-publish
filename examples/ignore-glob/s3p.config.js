/*
 * A string can be specified as the ignore opt (instead of a regex pattern) for glob matching (uses minimatch).
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

    // Ignore .dat files (default: undefined)
    ignore: '*.dat'
};

module.exports.schemaVersion = 1;