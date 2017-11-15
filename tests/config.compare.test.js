const path = require('path');
const test = require('tape');
const Configuration = require('../src/models/Configuration');
const {examples, checkCommon, checkIgnoreHidden} = require('./common/config');
const {datFile, gzippedFile} = require('./common/files');

test('Configuration.fromFile (compare)', function (t) {

    t.plan(checkCommon.count + checkIgnoreHidden.count + 3);

    Configuration.fromFile(path.join(examples, 'compare', 's3p.config.js'), (err, cfg) => {

        checkCommon(t, cfg);

        t.equal(cfg.opts.ignore.toString(), /^\.|\/\./.toString(), 'Check ignore opt');

        checkIgnoreHidden(t, cfg);

        cfg.compare(datFile, gzippedFile, true, (err, changed) => {
            t.equal(changed, false, '.dat files should be compared by size')
        });

        cfg.compare(gzippedFile, datFile, false, (err, changed) => {
            t.equal(changed, true, '.gz files should be compared by date')
        });
    });
});