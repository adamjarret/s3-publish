const fs = require('fs');
const minimatch = require('minimatch');
const {reduce} = require('neo-async');
const {isFunction, isObject, isRegExp, isString, range} = require('../vendor/lodash');
const {minSchemaVersion, maxSchemaVersion, version} = require('../../package.json');

class Configuration
{
    constructor(opts)
    {
        // Initialize opts with defaults
        this.opts = {
            profile: 'default',
            region: 'us-east-1',
            origin: process.cwd(),
            destination: undefined,
            ignore: undefined,
            all: undefined,
            porcelain: undefined,
            here: undefined,
            there: undefined,
            acl: undefined,
            concurrency: 1,
            debug: undefined,
            no: undefined,
            yes: undefined,
            change: undefined,
            delete: undefined,
            add: true,
            rules: undefined
        };

        this.setOpts(opts);

        this.ignore = this._ignore.bind(this);
        this.compare = this._compare.bind(this);
        this.alternateKey = this._alternateKey.bind(this);
        this.putParams = this._putParams.bind(this);
    }

    setOpts(opts)
    {
        Object.assign(this.opts, opts);
    }

    rules(memo, iteratee, callback)
    {
        reduce(this.opts.rules, memo, iteratee, callback);
    }

    _ignore(file, callback)
    {
        const {ignore, all} = this.opts;

        // If no ignore opt is defined (or all opt is defined), no files are ignored
        if (!ignore || all) {
            return callback(null, false);
        }

        // Treat string value as glob pattern (if provided)
        if (isString(ignore)) {
            try {
                return callback(null, minimatch(file.Key, ignore));
            }
            catch (e) {
                return callback(e);
            }
        }

        // Match regex pattern (if provided)
        if (isRegExp(ignore)) {
            try {
                return callback(null, !!file.Key.match(ignore));
            }
            catch (e) {
                return callback(e);
            }
        }

        // Call function (if provided)
        if (isFunction(ignore)) {
            return ignore.bind(this)(file, callback);
        }

        const e = new Error('Invalid value for `ignore` configuration option (must be a string, regex or function)');
        e.code = 'INVALID_CONFIG';
        e.subcode = 'BAD_IGNORE';
        return callback(null, false);
    }

    _compare(fileA, fileB, changed, callback)
    {
        this.rules(changed, (memo, rule, next) => {

            const {pattern, compare} = rule;

            if (!isFunction(compare) || !checkPattern(pattern, fileA)) {
                return next(null, memo);
            }

            compare.bind(this)(fileA, fileB, memo, next);

        }, callback);
    }

    _alternateKey(file, key, callback)
    {
        this.rules(key, (memo, rule, next) => {

            const {pattern, alternateKey} = rule;

            if (!isFunction(alternateKey) || !checkPattern(pattern, file)) {
                return next(null, memo);
            }

            alternateKey.bind(this)(file, memo, next);

        }, callback);
    }

    _putParams(file, params, callback)
    {
        this.rules(params, (memo, rule, next) => {

            const {pattern, putParams} = rule;

            if (!isFunction(putParams) || !checkPattern(pattern, file)) {
                return next(null, memo);
            }

            putParams.bind(this)(file, memo, next);

        }, callback);
    }

    load(objectOrFunction, callback)
    {
        // If schemaVersion is not supported, callback with error
        //  If schemaVersion is undefined or in supported range, continue loading without error
        const {schemaVersion} = objectOrFunction;
        if (schemaVersion < minSchemaVersion || schemaVersion > maxSchemaVersion) {
            const e = new Error(`Configuration schema version ${schemaVersion} is not compatible with s3p ${version}.`);
            e.message += ` Supported schema version(s): ${range(minSchemaVersion, maxSchemaVersion + 1)}`;
            e.code = 'INVALID_CONFIG';
            e.subcode = 'BAD_SCHEMA_VERSION';
            return callback(e)
        }

        // If a function was provided, call it and merge object from callback with existing opts
        //  Note: isObj returns true for functions, so check isFun first
        if (isFunction(objectOrFunction)) {
            return objectOrFunction((err, opts) => {

                // Handle callback error
                if (err) { return callback(err); }

                // Handle invalid opts type
                if (!isObject(opts)) {
                    const e = new Error('Configuration function must callback with a config object');
                    e.code = 'INVALID_CONFIG';
                    e.subcode = 'BAD_CALLBACK';
                    return callback(e)
                }

                this.setOpts(opts);
                return callback();
            });
        }

        // If neither an object nor a function was provided, callback with error
        if (!isObject(objectOrFunction)) {
            const e = new Error('Configuration file must export an object or function');
            e.code = 'INVALID_CONFIG';
            e.subcode = 'BAD_EXPORT';
            return callback(e)
        }

        // If an object was provided, merge values with existing opts and callback
        this.setOpts(objectOrFunction);
        return callback();
    }

    static fromFile(filePath, callback)
    {
        // Get file info
        fs.stat(filePath, (err) => {

            // Create new Configuration instance
            const cfg = new Configuration();

            // Handle file access errors (does not exist, no permission, etc)
            if (err) { return callback(err, cfg); }

            // Load object/function from filePath
            const objectOrFunction = require(filePath);

            // Callback with Configuration instance after loading values
            cfg.load(objectOrFunction, (err) => callback(err, cfg));
        });
    }

    static fromFileOrDefaults(filePath, callback)
    {
        // Ignore "file does not exist" errors
        Configuration.fromFile(filePath, (err, cfg) => callback(err && err.code === 'ENOENT' ? null : err, cfg));
    }
}

function checkPattern(pattern, file)
{
    // If pattern is not defined, rule applies to all origin files
    return !pattern || file.Key.match(pattern);
}

module.exports = Configuration;
