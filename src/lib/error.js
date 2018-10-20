const util = require('util');
const chalk = require('../constants/chalk');
const {isString} = require('../vendor/lodash');

const errorStyle = chalk.bold.red;

exports.printError = (error) => {
    if (!error) { return 0; }
    if (isString(error)) {
        console.error(errorStyle(error));
    }
    else {
        console.error(errorStyle(error.message));
        console.error(util.inspect(error));
    }
    return 1;
};
