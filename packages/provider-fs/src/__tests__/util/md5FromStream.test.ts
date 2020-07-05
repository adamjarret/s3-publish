import { Readable } from 'stream';
import { md5FromStream } from '../../util/md5FromStream';

const fooMd5 = 'acbd18db4cc2f85cedef654fccc4a4d8';

test('md5FromStream', async (done) => {
  const result = await md5FromStream(Readable.from(['foo']));

  expect(result).toBe(fooMd5);

  done();
});
