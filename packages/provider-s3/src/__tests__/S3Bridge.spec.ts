import { S3Bridge } from '../S3Bridge';
import { streamToString } from '@s3-publish/core/lib/__mock__/__util__/streamToString';
import { Readable } from 'stream';

test('S3Bridge.walkObjects', async () => {
  let i = 1;
  const handler = jest.fn((obj) => {
    switch (i) {
      case 1:
        expect(obj).toMatchObject({
          Key: 'Apple.txt',
          ETag: '"0a5353a3c313e216080c06097286c52f"',
          Size: 9
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 2:
        expect(obj).toMatchObject({
          Key: 'ace.txt',
          ETag: '"353274e173aabffd4138c8db40c6fdec"',
          Size: 7
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 3:
        expect(obj).toMatchObject({
          Key: 'docs/',
          ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 4:
        expect(obj).toMatchObject({
          Key: 'docs/about.md',
          ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 5:
        expect(obj).toMatchObject({
          Key: 'docs/assets/',
          ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 6:
        expect(obj).toMatchObject({
          Key: 'docs/assets/image.jpg',
          ETag: '"1fb5f004af66ba389b9d0d320cb14cea"',
          Size: 220399
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 7:
        expect(obj).toMatchObject({
          Key: 'docs/assets/styles.css',
          ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 8:
        expect(obj).toMatchObject({
          Key: 'docs/getting-started.md',
          ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 9:
        expect(obj).toMatchObject({
          Key: 'docs/tmp/',
          ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 10:
        expect(obj).toMatchObject({
          Key: 'docs/tmp/out.bak',
          ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;
    }
    i++;
  });

  const bridge = new S3Bridge();

  await bridge.walkObjects(
    {
      Bucket: 's3p-test-b'
    },
    handler
  );

  expect(handler).toHaveBeenCalledTimes(10);
});

test('S3Bridge.walkObjects: prefix', async () => {
  let i = 0;
  const handler = jest.fn((obj) => {
    switch (i) {
      case 0:
        expect(obj).toMatchObject({
          Key: 'fixtures/root/',
          ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 1:
        expect(obj).toMatchObject({
          Key: 'fixtures/root/Apple.txt',
          ETag: '"0a5353a3c313e216080c06097286c52f"',
          Size: 9
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 2:
        expect(obj).toMatchObject({
          Key: 'fixtures/root/ace.txt',
          ETag: '"353274e173aabffd4138c8db40c6fdec"',
          Size: 7
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 3:
        expect(obj).toMatchObject({
          Key: 'fixtures/root/docs/',
          ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 4:
        expect(obj).toMatchObject({
          Key: 'fixtures/root/docs/about.md',
          ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 5:
        expect(obj).toMatchObject({
          Key: 'fixtures/root/docs/assets/',
          ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 6:
        expect(obj).toMatchObject({
          Key: 'fixtures/root/docs/assets/image.jpg',
          ETag: '"1fb5f004af66ba389b9d0d320cb14cea"',
          Size: 220399
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 7:
        expect(obj).toMatchObject({
          Key: 'fixtures/root/docs/assets/styles.css',
          ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 8:
        expect(obj).toMatchObject({
          Key: 'fixtures/root/docs/getting-started.md',
          ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 9:
        expect(obj).toMatchObject({
          Key: 'fixtures/root/docs/tmp/',
          ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 10:
        expect(obj).toMatchObject({
          Key: 'fixtures/root/docs/tmp/out.bak',
          ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;
    }
    i++;
  });

  const bridge = new S3Bridge();

  await bridge.walkObjects(
    {
      Bucket: 's3p-test',
      Prefix: 'fixtures/root'
    },
    handler
  );

  expect(handler).toHaveBeenCalledTimes(11);
});

test('S3Bridge.getObjectReadStream', async () => {
  const bridge = new S3Bridge();

  const stream = bridge.getObjectReadStream({
    Bucket: 's3p-test',
    Key: 'fixtures/root/ace.txt'
  });

  expect(await streamToString(stream)).toBe('ace.txt');
});

describe('S3Bridge: write', () => {
  test('S3Bridge.copyObject', async () => {
    const bridge = new S3Bridge();

    const result = await bridge.copyObject({
      Bucket: 's3p-tmp',
      Key: 'fixtures/root/ace.txt',
      CopySource: '/s3p-test/fixtures/root/ace.txt'
    });

    expect(result.CopyObjectResult).toMatchObject({
      ETag: '"353274e173aabffd4138c8db40c6fdec"'
    });
  });

  test('S3Bridge.putObject', async () => {
    const bridge = new S3Bridge();

    const result = await bridge.putObject({
      Bucket: 's3p-tmp',
      Key: 'fixtures/root/ace.txt',
      Body: Readable.from(['Apple.txt']),
      ContentLength: 9
    });

    expect(result).toMatchObject({
      ETag: '"0a5353a3c313e216080c06097286c52f"'
    });
  });

  test('S3Bridge.deleteObject', async () => {
    const bridge = new S3Bridge();

    const result = await bridge.deleteObject({
      Bucket: 's3p-tmp',
      Key: 'fixtures/root/ace.txt'
    });

    expect(result).toEqual({});
  });
});
