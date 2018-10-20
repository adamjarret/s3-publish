#!/usr/bin/env node

const path = require('path');
const {waterfall} = require('neo-async');
const yargs = require('yargs');
const {printError} = require('./src/lib/error');
const {standardizePath} = require('./src/lib/path');
const Configuration = require('./src/models/Configuration');
const {config: awsConfig, SharedIniFileCredentials} = require('./src/vendor/aws-sdk');
const {isFunction, isRegExp} = require('./src/vendor/lodash');
const {author, bin, version} = require('./package.json');
const {init, ls, sync} = require('.');

function main(cfg, callback)
{
    let wasHandled = false;

    const cliName = Object.keys(bin)[0];
    const epilogue = `Author:\n  ${author}\n\nVersion:\n  ${version}`;
    const localConfig = cfg.opts;

    function handle(argv)
    {
        // Set wasHandled flag
        wasHandled = true;

        // Normalize origin and destination (unless handling the init command which should receive the unaltered value)
        if(argv._[0] !== 'init') {
            argv.origin = standardizePath(argv.origin);
            argv.destination = standardizePath(argv.destination);
        }

        // Update AWS Config
        const {profile, region} = argv;
        awsConfig.update({
            region,
            credentials: new SharedIniFileCredentials({profile})
        });

        // Update config (in case values were overridden by args)
        cfg.setOpts(argv);

        return cfg;
    }

    function describeLs(yargs)
    {
        yargs
            .alias('here', 'o')
            .describe('o', 'List files in origin')
            .boolean('o')
            .default('o', localConfig.here)

            .alias('there', 'd')
            .describe('d', 'List files in destination')
            .boolean('d')
            .default('d', localConfig.there)
    }

    function describeSync(yargs)
    {
        yargs
            .describe('acl', 'Use ACL versions of S3 functions')
            .boolean('acl')
            .default('acl', localConfig.acl)

            .alias('concurrency', 'm')
            .describe('m', 'Number of simultaneous file uploads')
            .number('m')
            .default('m', localConfig.concurrency)

            .describe('debug', 'Print request params to stdout')
            .boolean('debug')
            .default('debug', localConfig.debug)

            .alias('no', 'n')
            .describe('n', 'Preview operations only (dry run)')
            .boolean('n')
            .default('n', localConfig.no)

            .alias('yes', 'f')
            .alias('yes', 'y')
            .describe('y', 'Perform operations without prompting')
            .boolean('y')
            .default('y', localConfig.yes)

            .describe('add', 'Upload origin files not in destination')
            .boolean('add')
            .default('add', localConfig.add)

            .describe('change', 'Upload files even if unchanged')
            .boolean('change')
            .default('change', localConfig.change)

            .describe('delete', 'Delete destination files not in origin')
            .boolean('delete')
            .default('delete', localConfig['delete'])
    }

    // Parse arguments and run specified command
    // noinspection BadExpressionStatementJS
    yargs

        .usage(`${cliName} <command> [options]\n${cliName} <command> -? # command-specific help`)
        .demandCommand(1, 1, 'Please specify a command', 'Only one command may be specified')
        .epilogue(epilogue)
        .wrap(yargs.terminalWidth())

        .help()
        .alias('help', '?')

        .version(version)

        .describe('profile', 'AWS credentials profile')
        .string('profile')
        .default('profile', localConfig.profile)

        .describe('region', 'AWS region')
        .string('region')
        .default('region', localConfig.region)

        .describe('origin', 'Local source directory')
        .string('origin')
        .default('origin', localConfig.origin)

        .describe('destination', 'Destination S3 bucket')
        .string('destination')
        .default('destination', localConfig.destination,
            localConfig.destination ? `"${localConfig.destination}"` : 'undefined')

        .describe('ignore', 'Ignore pattern')
        .string('ignore')
        .default('ignore', () => localConfig.ignore,
            isFunction(localConfig.ignore) ? 'Function' : (
                isRegExp(localConfig.ignore) ? localConfig.ignore.toString() : (
                    localConfig.ignore ? `"${localConfig.ignore}"` : 'undefined'
                )
            )
        )

        .alias('all', 'a')
        .describe('a', 'Disable ignore (list/sync all files)')
        .boolean('a')
        .default('a', localConfig.all)

        .alias('porcelain', 'u')
        .describe('u', 'Show sizes in bytes, dates as ISO 8601, durations in ms, no colors, no progress bar')
        .boolean('u')
        .default('u', localConfig.porcelain)

        .command('init', 'Create s3p.config.js in CWD',
            (yargs) => {
                yargs
                    .usage(`${cliName} init [options]`)
                    .epilogue(epilogue);

                describeLs(yargs);
                describeSync(yargs);
            },
            (argv) => init(handle(argv), callback)
        )

        .command('ls', 'List files with checksum, mod date, and size',
            (yargs) => {
                yargs
                    .usage(`${cliName} ls [options] [LocalPath or S3Uri]...`)
                    .epilogue(epilogue);

                describeLs(yargs);
            },
            (argv) => ls(handle(argv), callback)
        )

        .command('sync', 'Upload changed origin files to destination',
            (yargs) => {
                yargs
                    .usage(`${cliName} sync [options] [origin] [destination]`)
                    .epilogue(epilogue);

                describeSync(yargs);
            },
            (argv) => sync(handle(argv), callback)
        )

        .argv;

    if (!wasHandled) {
        callback('Invalid command');
    }
}

const config = (cb) => Configuration.fromFileOrDefaults(path.join(process.cwd(), 's3p.config.js'), cb);

const done = (err) => process.exit(printError(err));

waterfall([config, main], done);
