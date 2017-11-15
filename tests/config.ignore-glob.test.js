const path = require('path');
const test = require('tape');
const Configuration = require('../src/models/Configuration');
const {examples, checkCommon} = require('./common/config');
const {datFile, gzippedFile} = require('./common/files');

test('Configuration.fromFile (ignore-glob)', function (t) {

    t.plan(checkCommon.count + 3);

    Configuration.fromFile(path.join(examples, 'ignore-glob', 's3p.config.js'), (err, cfg) => {

        checkCommon(t, cfg);

        t.equal(cfg.opts.ignore, '*.dat', 'Check ignore opt');

        cfg.ignore(datFile, (err, tf) => {
            t.equal(tf, true, '.dat files should be ignored');
        });

        cfg.ignore(gzippedFile, (err, tf) => {
            t.equal(tf, false, 'Non-.dat files should not be ignored');
        });
    });
});
