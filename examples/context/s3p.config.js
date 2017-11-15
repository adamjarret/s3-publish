/*
 * Context of functions is the Configuration object.
 * Options (including values overridden on the command line) are accessible via the this.opts property.
 * Any custom options are also accessible in this way.
 * This example demonstrates use with the ignore function but context also applies to functions in rules.
 * Note: Arrow functions may not be used when context is needed (ex. function(){} NOT () => {})
 */

module.exports = {

    // Path to directory containing files to be synced (default: current working directory)
    origin: '~/Desktop/s3p-test/www',

    // URI to S3 bucket where files will be uploaded
    destination: 's3://s3p-test',

    // Delete files from destination that do not exist in origin (default: false)
    delete: true,

    // Arbitrary custom value, can be overridden on command line just like standard options.
    thing: true,

    // Ignore files determined by context-aware function
    ignore: function (file, callback) {
        callback(null, this.opts.thing && !!file.Key.match(/^\.|\/\./));
    }
};

module.exports.schemaVersion = 1;