# s3-publish Configuration

Define publish options in a file named **s3p.config.js** in the root of your project.

A config file is not technically required (all options except `rules` may be specified on the command line)
but is highly recommended.

## Schema

    {
        profile: [String],
        region: [String],
        origin: [String],
        destination: [String],
        ignore: [String|RegEx|Function],
        all: [Boolean],
        porcelain: [Boolean],
        here: [Boolean],
        there: [Boolean],
        acl: [Boolean],
        concurrency: [Integer],
        debug: [Boolean],
        no: [Boolean],
        yes: [Boolean],
        change: [Boolean],
        delete: [Boolean],
        add: [Boolean],
        rules: [Array]
    }

See [main README](https://github.com/adamjarret/s3-publish) for option descriptions.

## Order of Operations

 1. `ignore`
 2. `alternateKey`
 3. `compare`
 4. `putParams`

## Examples

### simple

This example demonstrates the most basic configuration options.

### compare

This example demonstrates rules with custom compare functions. 

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

By default, files are compared by MD5 checksum to determine if they have changed. Therefore, the value of the `changed`
argument when the first rule is evaluated is the boolean value `fileA.ETag !== fileB.ETag`. When the second rule is
evaluated (only for files that match the `reGzip` pattern) the value of the `changed` argument will be
`fileA.Size !== fileB.Size` because results of the previous rule function are passed to the next rule function.

### context

This example demonstrates how to reference the config object in `ignore` and/or rule functions
(including custom values provided in config file or on the command line).
The context (`this`) references the Configuration object which stores all configured options in the `opts` property.

    // Arbitrary custom value, can be overridden on command line just like standard options.
    thing: true,

    // Ignore files determined by context-aware function
    ignore: function (file, callback) {
        callback(null, this.opts.thing && !!file.Key.match(/^\.|\/\./));
    }

Note: Arrow functions may not be used when context is needed (ex. `function(){}` NOT `() => {}`)

### gzip-encoding

This example demonstrates how to use `alternateKey` and `putParams` to implement special handling for **.gz** files.

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

`alternateKey` is defined here to remove the **.gz** extension from the destination `Key`.

By default, origin files are compared to destination files with the same `Key`. The `alternateKey` rule function
provides a way to specify that the corresponding destination file has a different `Key` than the origin file.
Note: The destination `Key` is used to determine the mime type of the file when generating the PUT params.

The first applicable `alternateKey` rule function will be passed `file.Key` as the value of the `key` argument.
If additional rules are defined that apply to **.gz** files and implement an `alternateKey` function,
the value of the `key` argument will be the result of the previously invoked `alternateKey` function.

Note: A rule `pattern` is always matched against `file.Key`, which means that the origin file name determines whether 
or not the rule applies. To put it another way: a subsequent rule that applies to **.gz** files will still be applied
even if the destination `Key` no longer has the **.gz** extension because of a previously evaluated rule.

`putParams` is defined here to add a `ContentEncoding` value of `'gzip'` to the params for files ending in **.gz**

The first applicable `putParams` rule function will be passed default PUT parameters
(`Bucket`, `Key`, `Body`, `ContentType`, `ContentLength`, and `ContentMD5`)
for the file as the value of the `params` argument.
If additional rules are defined that apply to **.gz** files and implement a `putParams` function,
the value of the `params` argument will be the result of the previously invoked `putParams` function.

Since `putParams` has complete control over the params (and could therefore change the `Key` param to rename the file),
why bother having a separate `alternateKey` function? Setting the `Key` in `putParams` does not give any
indication that this file should be **compared** to a destination file with a different `Key`
(only that it should be uploaded with that name) so on subsequent runs the file would always be re-uploaded.

### ignore-function

This example demonstrates how to implemented the `ignore` option as a function.

    // Ignore hidden files and files in hidden directories (default: undefined)
    ignore: (file, callback) => callback(null, file.Key.startsWith('.') || file.Key.indexOf('/.') > 0 )

The first callback argument should be an error (if encountered) or null.
The second callback argument should be a boolean value (`true` if file should be ignored, otherwise `false`).

### ignore-glob

This example demonstrates the `ignore` option defined as a string (strings are interpreted as glob patterns).

    // Ignore .dat files (default: undefined)
    ignore: '*.dat'

The [minimatch](https://github.com/isaacs/minimatch) library is used to match glob patterns.

### probably-overkill

This example demonstrates how to export a function instead of an object so all options may be defined
asynchronously.

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
