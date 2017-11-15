const path = require('path');
const test = require('tape');
const Configuration = require('../src/models/Configuration');
const {examples, checkCommon, checkIgnoreHidden} = require('./common/config');
const {datFile, gzippedFile} = require('./common/files');

test('Configuration.fromFile (simple)', function (t) {

    t.plan(checkCommon.count + checkIgnoreHidden.count + 2);

    Configuration.fromFile(path.join(examples, 'simple', 's3p.config.js'), (err, cfg) => {

        checkCommon(t, cfg);

        t.equal(cfg.opts.ignore.toString(), /^\.|\/\./.toString(), 'Check ignore opt');

        checkIgnoreHidden(t, cfg);

        cfg.compare(datFile, gzippedFile, true, (err, changed) => {
            t.equal(changed, true, 'rules opt can be undefined')
        });
    });
});
