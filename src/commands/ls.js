const {queue, series, waterfall} = require('neo-async');
const chalk = require('../constants/chalk');
const sourceFactory = require('../sources');
const {printError} = require('../lib/error');
const {standardizePath} = require('../lib/path');
const Command = require('../models/Command');
const {padEnd, padStart} = require('../vendor/lodash');

class LsCommand extends Command
{
    run(callback)
    {
        waterfall([
            this.determineLocations.bind(this),
            this.processLocations.bind(this)
        ], callback);
    }

    determineLocations(callback)
    {
        const {_: args, here, there, origin, destination} = this.cfg.opts;

        // Get unnamed args (yargs passes the command name as the first arg)
        const locations = (args ? args.slice(1) : []).map(a => standardizePath(a));

        // If no unnamed args were specified and neither location flag is set, use default locations
        if (!locations.length && !here && !there) {
            return this.defaultLocations(callback);
        }

        // Handle location flags
        here && origin && locations.push(origin);
        there && destination && locations.push(destination);

        callback(null, locations);
    }

    defaultLocations(callback)
    {
        const {origin} = this.cfg.opts;

        // List only origin by default
        callback(null, [origin]);
    }

    processLocations(pathsOrUris, callback)
    {
        let hasErrors = false;

        // Callback with error message if there's nothing to do
        if (!pathsOrUris || !pathsOrUris.length) {
            return callback('No local path or s3 uri specified');
        }

        // Create queue that calls op for each location (process 1 item at a time)
        const q = queue(this.processLocation.bind(this), 1);

        // Define queue completed callback
        q.drain = () => callback(!hasErrors ? null : 'Finished with errors');

        // Add locations to queue and begin processing
        q.push(pathsOrUris, (err) => {
            // If err, set hasErrors to true and print the error
            if (printError(err)) {
                hasErrors = true;
            }
        });
    }

    processLocation(pathOrUri, callback)
    {
        let size = 0;
        let count = 0;

        const {ignore} = this.cfg;

        // Take note of the time this operation begin
        const startDate = new Date();

        // Define handler called for each file listed
        const onFile = (file, cb) => ignore(file, (err, tf) => {
            if (err || tf) { return cb(err); }

            count++;
            size += file.Size;

            // Print file info and call next
            this.printRow(pathOrUri, file, cb);
        });

        series([

            // Print header row
            (next) => this.printHead(pathOrUri, startDate, next),

            // Use source factory to determine the proper source type for this location and invoke it
            (next) => sourceFactory(pathOrUri, onFile, next),

            // Print footer row
            (next) => {
                const endDate = new Date();
                this.printFoot(pathOrUri, endDate, endDate - startDate, count, size, next)
            }
        ], callback);
    }

    printRow(pathOrUri, {ETag, Key, LastModified, Size}, callback)
    {
        console.log('%s\t%s\t%s\t%s',
            ETag.replace(/"/g, ''),
            this.dateToString(LastModified),
            this.sizeToString(Size),
            Key
        );
        callback();
    }

    printHead(pathOrUri, startDate, callback)
    {
        console.log(chalk.bold('# %s\t%s\t%s\t%s'),
            this.firstColumn('ls'),
            this.dateToString(startDate),
            this.sizeToString(), // empty spacer
            pathOrUri + (pathOrUri.endsWith('/') ? '' : '/') // print pathOrUri with trailing slash to distinguish it
        );
        callback();
    }

    printFoot(pathOrUri, endDate, duration, count, size, callback)
    {
        console.log(chalk.bold('# %s\t%s\t%s\t%d files\n'),
            this.firstColumn(`Finished in ${this.durationToString(duration)}`),
            this.dateToString(endDate),
            this.sizeToString(size),
            count
        );
        callback();
    }

    sizeToString(sizeInBytes, minLength = 11)
    {
        // When porcelain, file sizes are in bytes (otherwise human readable ex. "42 KB")
        // If sizeInBytes is not defined, pad empty string
        const displaySize = sizeInBytes === undefined ? '' : (super.sizeToString(sizeInBytes).replace(' B', ' B '));

        // Spaces are added to the beginning of the returned value to make it at least minLength characters long
        return padStart(displaySize, minLength);
    }

    firstColumn(str, minLength = 30)
    {
        // Spaces are added to the end of the returned value to make it at least minLength characters long
        //  The default minLength is 30 (ETag is 32 characters long, -2 for "# " line prefix)
        return padEnd(str, minLength);
    }
}

const ls = (cfg, callback) => new ls.Command(cfg).run(callback);

ls.Command = LsCommand;

module.exports = ls;