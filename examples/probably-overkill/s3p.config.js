/*
 * s3p.config.js files can export a function instead of an object when it is useful to define the opts asynchronously.
 */

module.exports = function (callback) {

    // setTimeout is not required, it's just used here to demonstrate an async call
    setTimeout(() => {

        callback(null, {

            // AWS region (default: 'us-east-1')
            region: 'us-east-1',

            // Path to directory containing files to be synced (default: current working directory)
            origin: '~/Desktop/s3p-test/www',

            // URI to S3 bucket where files will be uploaded
            destination: 's3://s3p-test',

            // Delete files from destination that do not exist in origin (default: false)
            delete: true,

            // Ignore hidden files and files in hidden directories (default: undefined)
            ignore: /^\.|\/\./
        });

    }, 1);
};

module.exports.schemaVersion = 1;