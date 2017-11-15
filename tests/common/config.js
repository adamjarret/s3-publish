const path = require('path');
const {hiddenFile, fileInHiddenFolder, fileInHiddenSubfolder, gzippedFile} = require('./files');

exports.examples = path.join(__dirname, '..', '..', 'examples');

function checkCommon(t, cfg)
{
    t.equal(cfg.opts.profile, 'default', 'Check profile opt');
    t.equal(cfg.opts.region, 'us-east-1', 'Check region opt');
    t.equal(cfg.opts.origin, '~/Desktop/s3p-test/www', 'Check origin opt');
    t.equal(cfg.opts.destination, 's3://s3p-test', 'Check destination opt');
    t.equal(cfg.opts.delete, true, 'Check delete opt');
    t.equal(cfg.opts.concurrency, 1, 'Check concurrency opt');
}
checkCommon.count = 6;
exports.checkCommon = checkCommon;

function checkIgnoreHidden(t, cfg)
{
    cfg.ignore(hiddenFile, (err, tf) => {
        t.equal(tf, true, 'Hidden files should be ignored');
    });

    cfg.ignore(fileInHiddenFolder, (err, tf) => {
        t.equal(tf, true, 'File in hidden folders should be ignored');
    });

    cfg.ignore(fileInHiddenSubfolder, (err, tf) => {
        t.equal(tf, true, 'Files in hidden subfolders should be ignored');
    });

    cfg.ignore(gzippedFile, (err, tf) => {
        t.equal(tf, false, 'Non-hidden files should not be ignored');
    });
}
checkIgnoreHidden.count = 4;
exports.checkIgnoreHidden = checkIgnoreHidden;