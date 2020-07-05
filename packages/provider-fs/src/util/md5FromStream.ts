import { Readable } from 'stream';
import hasha from 'hasha';

const options = {
  algorithm: 'md5'
};

/**
 * Calculate MD5 hash from readable stream
 * @remarks This is a thin wrapper around {@link https://github.com/sindresorhus/hasha | hasha.fromStream}
 * @see {@link https://nodejs.org/api/stream.html#stream_class_stream_readable | Readable}
 * @internal
 */
export async function md5FromStream(stream: Readable): Promise<string | null> {
  return await hasha.fromStream(stream, options);
}
