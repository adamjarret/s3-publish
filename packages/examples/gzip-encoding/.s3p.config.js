// @ts-check

const { checkConfig } = require('@s3-publish/cli');

// RegEx pattern that matches file Keys ending in .gz
const reGzip = /\.gz$/;

// Use checkConfig util to reduce boilerplate
module.exports = checkConfig({
  origin: {
    root: './fixtures',
    // Ignore files and directories with names beginning with '.' (optional)
    ignorePatterns: ['.*']
  },

  target: {
    root: 's3://s3p-test/gzip',
    delegate: {
      // Provide a targetFileKey implementation to map origin files to differently named target files.
      // This is used when comparing files and also has the effect of "re-naming" the file when it is uploaded.
      // The following implementation will remove .gz file extension (if present)
      targetFileKey: (originFile) => Promise.resolve(originFile.Key.replace(reGzip, '')),
      // Provide a putFileParams implementation to modify the parameters that will be sent with the PUT request.
      // The following implementation will set the ContentEncoding param if the origin file Key matches,
      // otherwise the default params are returned unchanged.
      putFileParams: (originFile, params) => {
        if (reGzip.exec(originFile.Key)) {
          params.ContentEncoding = 'gzip';
        }
        return Promise.resolve(params);
      }
    }
  },

  schemaVersion: 2
});
