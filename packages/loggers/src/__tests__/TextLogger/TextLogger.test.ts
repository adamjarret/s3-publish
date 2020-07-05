import { PassThrough } from 'stream';
import { TextLogger } from '../../TextLogger';
import { LoggerOptions, LogMessage } from '../../types';
import { initResult } from '../__constants__/MessageTypes';

async function loggerOutput(
  options: LoggerOptions,
  messages: LogMessage[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const stream = new PassThrough();
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => {
      stream.destroy();
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    const logger = new TextLogger({ ...options, stream });
    messages.forEach((m) => logger.log(m));
    stream.end();
  });
}

test('TextLogger: initResult', async (done) => {
  const output = await loggerOutput({}, [
    {
      type: initResult,
      wrote: '/path/to/.s3.config.js'
    }
  ]);

  expect(output).toMatch(
    /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Wrote \/path\/to\/.s3.config.js/
  );

  done();
});

test('TextLogger: initResult (wrote: undefined)', async (done) => {
  const output = await loggerOutput({}, [
    {
      type: initResult
    }
  ]);

  // If the message does not define a `wrote` property, it is not logged
  expect(output).toBe('');

  done();
});
