const util = require('util');
const isStr = require('lodash/isString');
const chalk = require('../constants/chalk');

const errorStyle = chalk.bold.red;

exports.printError = (error) => {
    if (!error) { return 0; }
    if (isStr(error)) {
        console.error(errorStyle(error));
    }
    else {
        console.error(errorStyle(error.message));
        console.error(util.inspect(error));
    }
    return 1;
};
