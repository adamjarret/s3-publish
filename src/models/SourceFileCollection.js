const sourceFactory = require('../sources');

class SourceFileCollection
{
    constructor(ignore)
    {
        this.files = {};

        // Add file to list
        this.forceAdd = (file, callback) => {
            this.files[file.Key] = file;
            callback();
        };

        // Add file to list if ignore does not callback with true
        this.add = (file, callback) => !ignore ? this.forceAdd(file, callback) : ignore(file, (err, tf) => {
            if (!err && !tf) {
                this.forceAdd(file, callback);
            }
            callback(err);
        });

        // Use source factory to determine the proper source type and invoke it
        this.load = (location, callback) => sourceFactory(location, this.add, (err) => callback(err, this.files));
    }
}

module.exports = SourceFileCollection;