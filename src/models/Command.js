const dateformat = require('dateformat');
const filesize = require('filesize');
const prettyMs = require('pretty-ms');
const chalk = require('../constants/chalk');

class Command
{
    constructor(cfg)
    {
        this.cfg = cfg;

        const {porcelain} = this.cfg.opts;
        if(porcelain) {
            chalk.enabled = false;
        }
    }

    log(msg)
    {
        console.log(this.renderLogMessage(msg));
    }

    renderLogMessage(msg)
    {
        return `# [${this.dateToString(new Date())}] ${msg}`;
    }

    dateToString(date)
    {
        const {porcelain} = this.cfg.opts;

        // When porcelain, dates are UTC (otherwise local)
        return porcelain ? date.toISOString() : dateformat(date, 'yyyy-mm-dd hh:MM:ss TT');
    }

    durationToString(milliseconds)
    {
        const {porcelain} = this.cfg.opts;

        // When porcelain, durations are in milliseconds (otherwise human readable ex. "15d 11h 23m 20s")
        return porcelain ? `${milliseconds} ms` : prettyMs(milliseconds);
    }

    sizeToString(sizeInBytes)
    {
        const {porcelain} = this.cfg.opts;

        // When porcelain, file sizes are in bytes (otherwise human readable ex. "42 KB")
        return porcelain ? `${sizeInBytes}` : filesize(sizeInBytes, {round: 1});
    }
}

module.exports = Command;