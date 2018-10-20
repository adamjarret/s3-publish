const {series, each} = require('neo-async');
const {ADDED, CHANGED, DELETED, UNCHANGED} = require('../constants/status');

class ActionableCollection
{
    constructor(cfg, files)
    {
        this.cfg = cfg;
        this.files = {
            origin: Object.assign({}, files.origin),
            destination: Object.assign({}, files.destination)
        };
    }

    determineOperations(callback)
    {
        let bytesToTransfer = 0;

        const actionable = {};

        const del = (file, cb) => {
            actionable[file.Key] = DELETED;
            cb();
        };

        const check = (file, cb) => this.determineOperation(file, (err, status) => {

            // Handle errors and skipped files
            if (err || status === UNCHANGED) { return cb(err); }

            // Track how many bytes will need to be transferred for this operation
            if (status === ADDED || status === CHANGED) {
                bytesToTransfer += file.Size;
            }

            // Update actionable object
            actionable[file.Key] = status;
            cb();
        });

        // Determine operation for each file in origin then handle any remaining files in destination
        // (determineOperation prunes destination file list as files are handled).
        series([
            (cb) => each(this.files.origin, check, cb),
            (cb) => this.cfg.opts.delete ? each(this.files.destination, del, cb) : cb()
        ], (err) => callback(err, actionable, bytesToTransfer, this.files));
    }

    determineOperation(file, callback)
    {
        const {alternateKey, compare, opts: {add, change, debug}} = this.cfg;

        // Get the corresponding destination key for origin key (usually the same, but this allows
        //  the behavior to be overridden in config to accommodate special handling).
        alternateKey(file, file.Key, (err, destinationFileKey) => {

            // Handle error
            if (err) { return callback(err); }

            // Set file DestinationKey to result of alternateKey
            file.DestinationKey = destinationFileKey;

            // Get file for destinationFileKey
            const destinationFile = this.files.destination[destinationFileKey];

            // Remove file from list of destination files to indicate that it has been handled
            delete this.files.destination[destinationFileKey];

            if(debug) {
                console.log('Determine operation for %s (%s)', file.Key, destinationFileKey);
            }

            // If destination file does not exist, callback with ADDED status
            //  (or UNCHANGED if add opt is false)
            if(!destinationFile) {
                return callback(null, add ? ADDED : UNCHANGED);
            }

            // Compare origin file to destination file and callback with status
            compare(file, destinationFile, file.ETag !== destinationFile.ETag, (error, tf) => {
                callback(err, (change || tf) ? CHANGED : UNCHANGED);
            });
        });
    }
}

module.exports = ActionableCollection;