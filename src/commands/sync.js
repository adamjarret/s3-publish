const readline = require('readline');
const {parallel, waterfall, queue} = require('neo-async');
const ProgressBar = require('../models/ProgressBar');
const ActionableCollection = require('../models/ActionableCollection');
const SourceFileCollection = require('../models/SourceFileCollection');
const transportFactory = require('../transports');
const chalk = require('../constants/chalk');
const {colors, symbols, verbs} = require('../constants/status');
const {printError} = require('../lib/error');
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

        this.eachOperation(actionable, files, 1, this.previewOperation.bind(this), (err) => {

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
        const {concurrency, porcelain} = this.cfg.opts;

        // Display progress bar (if not porcelain)
        this.bar = porcelain ? null : (
            new ProgressBar(bytesToTransfer, Object.keys(actionable).length, this.sizeToString.bind(this))
        );

        // Process each actionable item
        this.eachOperation(actionable, files, concurrency, this.performOperation.bind(this), callback);
    }

    eachOperation(actionable, files, concurrency, processOperation, callback)
    {
        const keys = Object.keys(actionable).sort();

        if (!keys.length) {
            this.log('Nothing to do');
            return callback(DONE);
        }

        let hasErrors = false;

        // Callback called for each individual job
        const cb = (err) => {
            // If err, set hasErrors to true and print the error
            if (printError(err)) {
                hasErrors = true;
            }
        };

        // Create queue that calls processOperation for each job
        const q = queue(processOperation, concurrency);

        // Define queue completed callback
        q.drain = () => callback(!hasErrors ? null : 'Finished with errors');

        // Pause queue (until all jobs are added)
        q.pause();

        // Add jobs to queue
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            q.push({
                status: actionable[key],
                file: files.origin[key] || files.destination[key]
            }, cb);
        }

        // Begin processing queue jobs
        q.resume();
    }

    previewOperation({file, status}, callback)
    {
        // Use transport factory to determine the proper transport type for this operation and invoke it
        transportFactory(this.cfg, file, status, true, null, (err, to, from) => {

            // Handle errors and skipped files
            if (err || !to) { return callback(err); }

            // Write operation description to stdout
            console.log(chalk.keyword(colors[status])(`${symbols[status]} ${this.describeOperation(from, to)}`));
            callback();
        });
    }

    performOperation({file, status}, callback)
    {
        const {bar} = this;

        // Use transport factory to determine the proper transport type for this operation and invoke it
        transportFactory(this.cfg, file, status, false, (bar ? bar.tick : null), (err, to, from) => {

            // Handle errors and skipped files
            if (err || !to) { return callback(err); }

            // Write operation description to stdout
            const msg = `${verbs[status]} ${this.describeOperation(from, to)}`;
            if (bar && !bar.isComplete()) {
                bar.remainingKeys--;
                bar.interrupt(this.renderLogMessage(msg));
            }
            else {
                this.log(msg);
            }
            callback();
        });
    }

    describeOperation(from, to)
    {
        return (!from || to === from ? to : `${from} => ${to}`);
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
