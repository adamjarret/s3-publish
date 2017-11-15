/*
 * Rules can include custom compare functions to determine status (rules are cumulative and are applied in the order
 * they are defined).
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

    // Special handling rules
    rules: [
        {
            // No pattern is defined for this rule, so it applies to all origin files
            compare: (fileA, fileB, changed, callback) => {

                // Compare files by size and callback with boolean (true if changed, otherwise false)
                callback(null, fileA.Size !== fileB.Size)
            }
        },
        {
            // Rule only applies to origin files with Keys that match the pattern
            pattern: reGzip,

            compare: (fileA, fileB, changed, callback) => {

                // Compare .gz files by modification date and callback with boolean (true if changed, otherwise false)
                callback(null, fileA.LastModified < fileB.LastModified);
            }
        }
    ]
};

module.exports.schemaVersion = 1;