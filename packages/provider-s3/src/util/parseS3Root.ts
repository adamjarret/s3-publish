import { S3Root } from '../types';

const reS3Uri = /s3:\/\/([^/]+)\/?(.*)\/?/i;

/**
 * @returns `S3Root` instance if the provided URI is valid, otherwise `null`
 */
export function parseS3Root(s3Uri: string): S3Root | null {
  const matches = !s3Uri || !s3Uri.match ? false : s3Uri.match(reS3Uri);
  if (!matches) {
    return null;
  }
  return {
    Bucket: matches[1],
    Prefix: matches[2]
  };
}

export default parseS3Root;
