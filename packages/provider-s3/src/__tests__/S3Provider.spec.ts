import { randomBytes } from 'crypto';
import { DeleteObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { File } from '@s3-publish/core';
import { streamToString } from '@s3-publish/core/lib/__mock__/__util__/streamToString';
import { S3Provider } from '../S3Provider';

describe('S3Provider.spec', () => {
  const now = new Date();
  const suffix = randomBytes(3).toString('hex');
  const prefix = `${now.toISOString().substring(0, 10)}-${now.getTime()}-${suffix}`;
  const client = new S3Client({ region: 'us-east-1' });

  test('listFiles', async () => {
    const provider = new S3Provider({
      root: 's3://s3p-test/fixtures/root'
    });
    const files = await provider.listFiles();

    expect(files.size).toBe(7);
  });

  test('listFiles: delegate', async () => {
    const provider = new S3Provider({
      root: 's3://s3p-test-b',
      delegate: {
        listFilesParams: (params) => Promise.resolve({ ...params, MaxKeys: 5 })
      }
    });

    let i = 1;
    const handler = jest.fn((obj) => {
      switch (i) {
        case 1:
          expect(obj).toMatchObject({
            Key: 'Apple.txt',
            ETag: '0a5353a3c313e216080c06097286c52f',
            Size: 9
          });
          expect(obj.LastModified).toBeDefined();
          break;

        case 2:
          expect(obj).toMatchObject({
            Key: 'ace.txt',
            ETag: '353274e173aabffd4138c8db40c6fdec',
            Size: 7
          });
          expect(obj.LastModified).toBeDefined();
          break;

        case 3:
          expect(obj).toMatchObject({
            Key: 'docs/about.md',
            ETag: 'd41d8cd98f00b204e9800998ecf8427e',
            Size: 0
          });
          expect(obj.LastModified).toBeDefined();
          break;

        case 4:
          expect(obj).toMatchObject({
            Key: 'docs/assets/image.jpg',
            ETag: '1fb5f004af66ba389b9d0d320cb14cea',
            Size: 220399
          });
          expect(obj.LastModified).toBeDefined();
          break;

        case 5:
          expect(obj).toMatchObject({
            Key: 'docs/assets/styles.css',
            ETag: 'd41d8cd98f00b204e9800998ecf8427e',
            Size: 0
          });
          expect(obj.LastModified).toBeDefined();
          break;

        case 6:
          expect(obj).toMatchObject({
            Key: 'docs/getting-started.md',
            ETag: 'd41d8cd98f00b204e9800998ecf8427e',
            Size: 0
          });
          expect(obj.LastModified).toBeDefined();
          break;

        case 7:
          expect(obj).toMatchObject({
            Key: 'docs/tmp/out.bak',
            ETag: 'd41d8cd98f00b204e9800998ecf8427e',
            Size: 0
          });
          expect(obj.LastModified).toBeDefined();
          break;
      }
      i++;
    });

    const files = await provider.listFiles();

    files.forEach(handler);

    expect(handler).toHaveBeenCalledTimes(7);
  });

  test('getFile', async () => {
    const provider = new S3Provider({
      root: 's3://s3p-test/'
    });

    const stream = await provider.getFile({
      SourceProvider: provider,
      Key: 'fixtures/root/ace.txt'
    });

    expect(await streamToString(stream)).toBe('ace.txt');
  });

  test('copyFile', async () => {
    const providerA = new S3Provider({
      root: 's3://s3p-test-b'
    });
    const providerB = new S3Provider({
      root: `s3://s3p-tmp/${prefix}/fixtures/root`
    });
    const file: File = {
      SourceProvider: providerA,
      Key: 'Apple.txt',
      Size: 9,
      ETag: '0a5353a3c313e216080c06097286c52f'
    };
    const expectedParams = {
      Bucket: 's3p-tmp',
      Key: `${prefix}/fixtures/root/Apple.txt`,
      CopySource: 's3p-test-b/Apple.txt'
    };
    const operation = await providerB.copyFile(file, 'CHANGE');

    expect(operation.file).toEqual(file);
    expect(operation.params).toEqual(expectedParams);
    expect(operation.type).toBe('COPY');
    expect(operation.reason).toBe('CHANGE');

    await operation.job();

    const { Bucket, Key } = expectedParams;
    const result = await client.send(new HeadObjectCommand({ Bucket, Key }));

    expect(result.ETag).toBe('"0a5353a3c313e216080c06097286c52f"');

    // Cleanup (delete) copied file
    await client.send(new DeleteObjectCommand({ Bucket, Key }));
  });

  test('putFile', async () => {
    const providerA = new S3Provider({
      root: 's3://s3p-test-b'
    });
    const providerB = new S3Provider({
      root: `s3://s3p-tmp/${prefix}/fixtures/root`
    });
    const file: File = {
      SourceProvider: providerA,
      Key: 'Apple.txt',
      Size: 9,
      ETag: '0a5353a3c313e216080c06097286c52f'
    };
    const expectedParams = {
      Bucket: 's3p-tmp',
      Key: `${prefix}/fixtures/root/Apple.txt`,
      ContentType: 'text/plain',
      ContentMD5: 'ClNTo8MT4hYIDAYJcobFLw==',
      ContentLength: 9
    };
    const operation = await providerB.putFile(file, 'CHANGE');

    expect(operation.file).toEqual(file);
    expect(operation.params).toEqual(expectedParams);
    expect(operation.type).toBe('PUT');
    expect(operation.reason).toBe('CHANGE');

    await operation.job();

    const { Bucket, Key } = expectedParams;
    const result = await client.send(new HeadObjectCommand({ Bucket, Key }));

    expect(result.ETag).toBe('"0a5353a3c313e216080c06097286c52f"');

    // DO NOT clean up (delete) file here, should exist for next test
  });

  test('deleteFile', async () => {
    const providerA = new S3Provider({
      root: 's3://s3p-test-b'
    });
    const providerB = new S3Provider({
      root: `s3://s3p-tmp/${prefix}/fixtures/root`
    });
    const file: File = {
      SourceProvider: providerA,
      Key: 'Apple.txt',
      Size: 9,
      ETag: '0a5353a3c313e216080c06097286c52f'
    };
    const expectedParams = {
      Bucket: 's3p-tmp',
      Key: `${prefix}/fixtures/root/Apple.txt`
    };
    const operation = await providerB.deleteFile(file);

    expect(operation.file).toEqual(file);
    expect(operation.params).toEqual(expectedParams);
    expect(operation.type).toBe('DELETE');
    expect(operation.reason).toBeUndefined();

    await operation.job();

    try {
      await client.send(new HeadObjectCommand(expectedParams));
      throw new Error('Did not throw');
    } catch (error) {
      expect(error.name).toMatch(/NotFound/);
    }
  });
});
