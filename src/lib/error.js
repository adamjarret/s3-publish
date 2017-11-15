const util = require('util');
const chalk = require('chalk');
const isStr = require('lodash.isstring');

const errorStyle = chalk.bold.red;

exports.printError = (error) => {
    if (!error) { return false; }
    if (isStr(error)) {
        console.error(errorStyle(error));
    }
    else {
        console.error(errorStyle(error.message));
        console.error(util.inspect(error));
    }
    return true;
};
