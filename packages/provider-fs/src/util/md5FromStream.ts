import { createHash } from 'crypto';
import { Readable, pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

/**
 * Calculate MD5 hash from readable stream
 * 
 * @param stream Readable input steam
 * @returns Promise that resolves with the MD5 hash of the input stream
 * @internal
 */
export async function md5FromStream(stream: Readable): Promise<string> {
  const hash = createHash('md5');
  await pipelineAsync(stream, hash);
  return hash.digest('hex');
}
