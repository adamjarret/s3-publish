import { PassThrough, Readable } from 'stream';

/** @internal */
export function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    const chunks: string[] = [];
    const handleChunk = (chunk: string) => chunks.push(chunk);
    output.on('data', handleChunk);

    stream
      .pipe(output)
      .on('finish', () => {
        output.off('data', handleChunk);
        resolve(chunks.join(''));
      })
      .on('error', reject);
  });
}
