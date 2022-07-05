import { createHash } from 'crypto';
import { Readable, pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

/**
 * Calculate MD5 hash from readable stream
 * @internal
 */
export async function md5FromStream(stream: Readable): Promise<string | null> {
  const hash = createHash('md5');
  await pipelineAsync(stream, hash);
  return hash.digest('hex');
}
