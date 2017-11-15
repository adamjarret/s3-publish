const path = require('path');
const test = require('tape');
const Configuration = require('../src/models/Configuration');
const {examples, checkCommon, checkIgnoreHidden} = require('./common/config');
const {datFile, gzippedFile} = require('./common/files');

test('Configuration.fromFile (gzip-encoding)', function (t) {

    t.plan(checkCommon.count + checkIgnoreHidden.count + 5);

    Configuration.fromFile(path.join(examples, 'gzip-encoding', 's3p.config.js'), (err, cfg) => {

        checkCommon(t, cfg);

        t.equal(cfg.opts.ignore.toString(), /^\.|\/\./.toString(), 'Check ignore opt');

        checkIgnoreHidden(t, cfg);

        cfg.alternateKey(gzippedFile, gzippedFile.Key, (err, key) => {
            t.equal(key, 'A.txt', 'Alternate key should not include .gz extension');
        });

        cfg.putParams(gzippedFile, {}, (err, params) => {
            t.equal(params.ContentEncoding, 'gzip', 'ContentEncoding param should be "gzip"');
        });

        cfg.alternateKey(datFile, datFile.Key, (err, key) => {
            t.equal(key, datFile.Key, 'Alternate key should be unchanged for non-.gz files');
        });

        cfg.putParams(datFile, {}, (err, params) => {
            t.equal(params.ContentEncoding, undefined, 'ContentEncoding should not be set for non-.gz files');
        });
    });
});