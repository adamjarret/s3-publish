/* eslint-disable @typescript-eslint/no-var-requires */
const pkgCli = require('../../package.json');
const pkgCore = require('@s3-publish/core/package.json');
const pkgLog = require('@s3-publish/loggers/package.json');
const pkgFs = require('@s3-publish/provider-fs/package.json');
const pkgS3 = require('@s3-publish/provider-s3/package.json');

/** @internal */
export const packageVersions = {
  '@s3-publish/cli': pkgCli.version,
  '@s3-publish/core': pkgCore.version,
  '@s3-publish/loggers': pkgLog.version,
  '@s3-publish/provider-fs': pkgFs.version,
  '@s3-publish/provider-s3': pkgS3.version
};
