const fs = require('fs');
const path = require('path');
const walk = require('walk');
const md5File = require('md5-file');

module.exports = (dirPath, onFile, callback) => {

    if(!fs.existsSync(dirPath)) {
        return callback(`${dirPath} does not exist`);
    }

    let count = 0;

    const error = new Error('Error(s) encountered listing local files');
    error.innerErrors = [];
    error.addWalkerError = (root, {name, error: err}) => {
        err.walkerRoot = root;
        err.walkerFileName = name;
        this.innerErrors.push(err);
    };

    const walker = walk.walk(dirPath);

    walker.on('file', (root, {name, size, mtime}, next) => {

        count++;

        const filePath = path.join(root, name);
        md5File(filePath, (err, sum) => {
            if(err) {
                error.addWalkerError(root, {name, error: err});
                return next();
            }
            onFile({
                ETag: `"${sum}"`,
                Key: filePath
                        .replace(dirPath, '')   // Key is relative
                        .replace(/\\/g, '/')    // Normalize Windows path separator
                        .replace(/^\/+/, ''),   // Key should not begin with a slash
                LastModified: mtime,
                Size: size
            }, next);
        });
    });

    walker.on('errors', (root, nodeStatsArray, next) => {

        // Handle errors encountered by fs.stat when reading nodes in a directory
        for(let nodeStats of nodeStatsArray) {
            error.addWalkerError(root, nodeStats);
        }
        next();
    });

    walker.on('end', () => callback && callback(!error.innerErrors.length ? null : error, count));
};