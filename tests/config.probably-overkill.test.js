const path = require('path');
const test = require('tape');
const Configuration = require('../src/models/Configuration');
const {examples, checkCommon, checkIgnoreHidden} = require('./common/config');

test('Configuration.fromFile (probably-overkill)', function (t) {

    t.plan(checkCommon.count + checkIgnoreHidden.count + 1);

    Configuration.fromFile(path.join(examples, 'probably-overkill', 's3p.config.js'), (err, cfg) => {

        checkCommon(t, cfg);

        t.equal(cfg.opts.ignore.toString(), /^\.|\/\./.toString(), 'Check ignore opt');

        checkIgnoreHidden(t, cfg);
    });
});
