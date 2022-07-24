import { File, Provider } from '@s3-publish/core';
import { S3Object } from '../types';

const reQuote = /"/g;
const reLeadingSlashes = /^\/+/;

/** @internal */
export function createFileFromS3Object(
  obj: S3Object,
  provider: Provider,
  prefix: string
): File | null {
  if (!obj.Key) {
    return null;
  }

  // Key is relative to SourceProvider root and should not begin with a slash
  const Key = obj.Key.replace(prefix, '').replace(reLeadingSlashes, '');

  // file.Key will be '' for root, do not process "directories"
  if (!Key || Key.endsWith('/')) {
    return null;
  }

  return {
    SourceProvider: provider,
    Key,
    Size: obj.Size,
    LastModified: obj.LastModified,
    // Remove quotes from ETag (if defined)
    ETag: !obj.ETag ? undefined : obj.ETag.replace(reQuote, '')
  };
}

/** @internal */
export default createFileFromS3Object;
