const readline = require('readline');
const {parallel, waterfall, eachLimit} = require('async');
const chalk = require('chalk');
const ProgressBar = require('../models/ProgressBar');
const ActionableCollection = require('../models/ActionableCollection');
const SourceFileCollection = require('../models/SourceFileCollection');
const transportFactory = require('../transports');
const {colors, symbols, verbs} = require('../constants/status');
const {standardizePath} = require('../lib/path');
const Command = require('../models/Command');

const DONE = 'DONE';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class SyncCommand extends Command
{
    constructor(cfg)
    {
        super(cfg);

        // Get unnamed args (yargs passes the command name as the first arg)
        const args = (cfg.opts && cfg.opts._ ? cfg.opts._.slice(1) : []);

        // Update config
        this.cfg.setOpts({
            // Allow origin and destination to be specified as unnamed args
            origin: args.length ? standardizePath(args[0]) : cfg.opts.origin,
            destination: args.length > 1 ? standardizePath(args[1]) : cfg.opts.destination
        });
    }

    run(callback)
    {
        const startDate = new Date();

        waterfall([

            // Enumerate files in specified locations
            this.loadSources.bind(this),

            // Compare enumerated files
            this.determineOperations.bind(this),

            // Show what operations will be performed
            this.previewOperations.bind(this),

            // Apply changes (upload/delete files)
            this.performOperations.bind(this),

        ], (err) => {

            // Handle error
            if (err && err !== DONE) { return callback(err); }

            // Log duration
            this.log(`Finished in ${this.durationToString(new Date() - startDate)}`);

            callback();
        });
    }

    loadSources(callback)
    {
        const {cfg} = this;
        const {origin, destination} = cfg.opts;
        const originFiles = new SourceFileCollection(cfg.ignore);
        const destinationFiles = new SourceFileCollection();

        this.log(`Listing files in "${origin}" and "${destination}"`);

        parallel({
            origin: (cb) => originFiles.load(origin, cb),
            destination: (cb) => destinationFiles.load(destination, cb)
        }, callback);
    }

    determineOperations(files, callback)
    {
        this.log('Comparing files');

        const actionable = new ActionableCollection(this.cfg, files);
        actionable.determineOperations(callback);
    }

    previewOperations(actionable, bytesToTransfer, files, callback)
    {
        const {no, yes} = this.cfg.opts;

        const onNo = () => callback(DONE);

        const onYes = () => callback(null, actionable, bytesToTransfer, files);

        this.eachOperation(actionable, files, 1, null, (err) => {

            // Handle transport error (if present)
            if (err) { return callback(err); }

            // Show total bytes to be transferred
            this.log(`${this.sizeToString(bytesToTransfer)} to transfer`);

            // If no, don't prompt or perform operations
            if (no) {
                this.log('Nothing to do (dry run)');
                return onNo();
            }

            // If yes, don't prompt but perform operations
            if (yes) { return onYes(); }

            // Otherwise, prompt and perform operations unless answer begins with the letter n (case-insensitive)
            rl.question('Perform operations? [Y/n] ', (answer) => {
                rl.close();
                return answer.match(/^n/i) ? onNo() : onYes();
            });
        });
    }

    performOperations(actionable, bytesToTransfer, files, callback)
    {
        const {concurrency} = this.cfg.opts;

        // Display progress bar
        const bar = new ProgressBar(bytesToTransfer, Object.keys(actionable).length, this.sizeToString.bind(this));

        // Process each actionable item
        this.eachOperation(actionable, files, concurrency, bar, callback);
    }

    eachOperation(actionable, files, concurrency, bar, callback)
    {
        const keys = Object.keys(actionable).sort();

        if (!keys.length) {
            this.log('Nothing to do');
            return callback(DONE);
        }

        // Call previewOperation for each key in actionable
        eachLimit(keys, concurrency, (key, cb) => {
            this.processOperation(files.origin[key] || files.destination[key], actionable[key], bar, cb);
        }, callback);
    }

    processOperation(file, status, bar, callback)
    {
        // Use transport factory to determine the proper transport type for this operation and invoke it
        transportFactory(this.cfg, file, status, !bar, (bar ? bar.tick : null), (err, to, from) => {

            // Handle errors and skipped files
            if (err || !to) { return callback(err); }

            // Write operation description to stdout
            const description = (!from || to === from) ? to : `${from} => ${to}`;
            if(bar) {
                const msg = `${verbs[status]} ${description}`;
                if(!bar.isComplete()) {
                    bar.remainingKeys--;
                    bar.interrupt(this.renderLogMessage(msg));
                }
                else {
                    this.log(msg);
                }
            }
            else {
                console.log(chalk.keyword(colors[status])(`${symbols[status]} ${description}`));
            }
            callback();
        });
    }

    sizeToString(sizeInBytes, suffix = ' B')
    {
        const {porcelain} = this.cfg.opts;

        // When porcelain, file sizes are in bytes (otherwise human readable ex. "42 KB")
        // ' B' suffix is added by default to denote bytes when porcelain (sync only)
        return super.sizeToString(sizeInBytes) + (porcelain ? suffix : '');
    }
}

const sync = (cfg, callback) => new sync.Command(cfg).run(callback);

sync.Command = SyncCommand;

module.exports = sync;
