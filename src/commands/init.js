const fs = require('fs');
const path = require('path');
const mustache = require('mustache');
const {standardizePath} = require('../lib/path');

module.exports = (cfg, callback) => {

    const outFile = standardizePath(path.join(process.cwd(), 's3p.config.js'));

    if(fs.existsSync(outFile)) {

        // Refuse to overwrite existing file
        return callback(`${outFile} already exists`);
    }

    const view = Object.assign({}, cfg.opts);
    const blacklist = ['$0', 'help', 'version', ...Object.keys(view).filter(k => k.length < 2)];
    for(let prop of blacklist) {
        delete view[prop];
    }

    // Add is true by default, so only include value in generated config if explicitly set to false
    if(view.add !== false) {
        delete view.add;
    }

    fs.readFile(path.join(__dirname, '..', '..', 'templates', 's3p.config.js.mustache'), 'utf8', (err, data) => {

        // Handle errors encountered while loading the template file
        if(err) { return callback(err); }

        try {
            // Generate output from template
            const output = mustache.render(data, {json: JSON.stringify(view, null, 4)});

            console.log(`Generating ${outFile}`);
            console.log(output);

            // Write output to file
            fs.writeFile(outFile, output, 'utf8', callback);
        }
        catch (e) {

            // Handle errors encountered while rendering the template
            if(err) { return callback(err); }
        }
    });
};