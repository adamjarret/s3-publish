import { Readable } from 'stream';
import { mockClient } from 'aws-sdk-client-mock';
import { mockLibStorageUpload } from 'aws-sdk-client-mock/libStorage';
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3';
import { File } from '@s3-publish/core';
import { S3Provider } from '../S3Provider';

const s3Mock = mockClient(S3Client);

describe('S3Provider.write', () => {
  beforeEach(() => {
    s3Mock.reset();
    mockLibStorageUpload(s3Mock);
  });

  test('putFile', async () => {
    s3Mock.on(GetObjectCommand).resolves({
      Body: Readable.from(['Apple.txt']),
      ETag: '"0a5353a3c313e216080c06097286c52f"'
    });

    const providerA = new S3Provider({
      root: 's3://s3p-test-a'
    });
    const providerB = new S3Provider({
      root: 's3://s3p-test-b/foo'
    });
    const file: File = {
      SourceProvider: providerA,
      Key: 'Apple.txt',
      Size: 9,
      ETag: '0a5353a3c313e216080c06097286c52f'
    };
    const expectedParams = {
      Bucket: 's3p-test-b',
      Key: 'foo/Apple.txt',
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

    expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, expectedParams);
  });

  test('putFile: delegate', async () => {
    s3Mock.on(GetObjectCommand).resolves({
      Body: Readable.from(['Apple.txt']),
      ETag: '"0a5353a3c313e216080c06097286c52f"'
    });

    const providerA = new S3Provider({
      root: 's3://s3p-test-a'
    });
    const providerB = new S3Provider({
      root: 's3://s3p-test-b/foo',
      delegate: {
        putFileParams: (file, params) =>
          Promise.resolve({ ...params, CacheControl: 'max-age=900' })
      }
    });
    const file: File = {
      SourceProvider: providerA,
      Key: 'Apple.txt',
      Size: 9,
      ETag: '0a5353a3c313e216080c06097286c52f'
    };
    const expectedParams = {
      Bucket: 's3p-test-b',
      Key: 'foo/Apple.txt',
      ContentType: 'text/plain',
      ContentMD5: 'ClNTo8MT4hYIDAYJcobFLw==',
      ContentLength: 9,
      CacheControl: 'max-age=900'
    };
    const operation = await providerB.putFile(file, 'ADD');

    expect(operation.file).toEqual(file);
    expect(operation.params).toEqual(expectedParams);
    expect(operation.type).toBe('PUT');
    expect(operation.reason).toBe('ADD');

    await operation.job();

    expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, expectedParams);
  });

  test('putFile: delegate with body', async () => {
    const content = 'hello';
    const Body = Readable.from([content]);
    const providerA = new S3Provider({
      root: 's3://s3p-test-a'
    });
    const providerB = new S3Provider({
      root: 's3://s3p-test-b/foo',
      delegate: {
        putFileParams: (file, params) => Promise.resolve({ ...params, Body })
      }
    });
    const file: File = {
      SourceProvider: providerA,
      Key: 'Apple.txt',
      Size: 9,
      ETag: '0a5353a3c313e216080c06097286c52f'
    };
    const expectedParams = {
      Body,
      Bucket: 's3p-test-b',
      Key: 'foo/Apple.txt',
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

    const calls = s3Mock.commandCalls(PutObjectCommand);

    expect(calls.length).toBe(1);

    const [call] = calls;

    const { Body: actualBody, ...actual } = call.args[0].input;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Body: expectedBody, ...expected } = expectedParams;

    expect(actual).toEqual(expected);
    expect(actualBody?.toString('utf8')).toBe(content);
  });

  test('putFile: checksum=false', async () => {
    const content = 'Apple.txt';
    const Body = Readable.from([content]);
    s3Mock.on(GetObjectCommand).resolves({
      Body,
      ETag: '"0a5353a3c313e216080c06097286c52f"'
    });

    const providerA = new S3Provider({
      root: 's3://s3p-test-a'
    });
    const providerB = new S3Provider({
      root: 's3://s3p-test-b/foo',
      checksum: false
    });
    const file: File = {
      SourceProvider: providerA,
      Key: 'Apple.txt',
      Size: 9,
      ETag: '0a5353a3c313e216080c06097286c52f'
    };
    const expectedParams = {
      Bucket: 's3p-test-b',
      Key: 'foo/Apple.txt',
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

    const calls = s3Mock.commandCalls(PutObjectCommand);

    expect(calls.length).toBe(1);

    const [call] = calls;

    const { Body: actualBody, ...actual } = call.args[0].input;

    expect(actual).toEqual(expectedParams);
    expect(actualBody?.toString('utf8')).toBe(content);
  });

  test('putFile: checksum=false, no ETag', async () => {
    const content = 'Apple.txt';
    const Body = Readable.from([content]);
    s3Mock.on(GetObjectCommand).resolves({
      Body,
      ETag: '"0a5353a3c313e216080c06097286c52f"'
    });

    const providerA = new S3Provider({
      root: 's3://s3p-test-a'
    });
    const providerB = new S3Provider({
      root: 's3://s3p-test-b/foo',
      checksum: false
    });
    const file: File = {
      SourceProvider: providerA,
      Key: 'Apple.txt',
      Size: 9
    };
    const expectedParams = {
      Bucket: 's3p-test-b',
      Key: 'foo/Apple.txt',
      ContentType: 'text/plain',
      ContentLength: 9
    };
    const operation = await providerB.putFile(file, 'CHANGE');

    expect(operation.file).toEqual(file);
    expect(operation.params).toEqual(expectedParams);
    expect(operation.type).toBe('PUT');
    expect(operation.reason).toBe('CHANGE');

    await operation.job();

    const calls = s3Mock.commandCalls(PutObjectCommand);

    expect(calls.length).toBe(1);

    const [call] = calls;

    const { Body: actualBody, ...actual } = call.args[0].input;

    expect(actual).toEqual(expectedParams);
    expect(actualBody?.toString('utf8')).toBe(content);
  });

  test('putFile: checksum=true, no ETag', async () => {
    const content = 'Apple.txt';
    s3Mock.on(GetObjectCommand).resolves({
      Body: Readable.from([content])
      //ETag: '"0a5353a3c313e216080c06097286c52f"'
    });

    const providerA = new S3Provider({
      root: 's3://s3p-test-a'
    });
    const providerB = new S3Provider({
      root: 's3://s3p-test-b/foo'
    });
    const file: File = {
      SourceProvider: providerA,
      Key: 'Apple.txt',
      Size: 9
    };

    try {
      await providerB.putFile(file, 'CHANGE');
      throw new Error('Did not throw');
    } catch (error) {
      expect(error.message).toBe('Missing ETag');
    }
  });

  test('putFile: unknown mime type', async () => {
    const content = 'Apple.not-a-thing';
    const Body = Readable.from([content]);
    s3Mock.on(GetObjectCommand).resolves({
      Body,
      ETag: '"0a5353a3c313e216080c06097286c52f"'
    });

    const providerA = new S3Provider({
      root: 's3://s3p-test-a'
    });
    const providerB = new S3Provider({
      root: 's3://s3p-test-b/foo',
      checksum: false
    });
    const file: File = {
      SourceProvider: providerA,
      Key: 'Apple.not-a-thing',
      Size: 9
    };
    const expectedParams = {
      Bucket: 's3p-test-b',
      Key: 'foo/Apple.not-a-thing',
      ContentType: undefined,
      ContentLength: 9
    };
    const operation = await providerB.putFile(file, 'CHANGE');

    expect(operation.file).toEqual(file);
    expect(operation.params).toEqual(expectedParams);
    expect(operation.type).toBe('PUT');
    expect(operation.reason).toBe('CHANGE');

    await operation.job();

    const calls = s3Mock.commandCalls(PutObjectCommand);

    expect(calls.length).toBe(1);

    const [call] = calls;

    const { Body: actualBody, ...actual } = call.args[0].input;

    expect(actual).toEqual(expectedParams);
    expect(actualBody?.toString('utf8')).toBe(content);
  });

  test('copyFile', async () => {
    const providerA = new S3Provider({
      root: 's3://s3p-test-a'
    });
    const providerB = new S3Provider({
      root: 's3://s3p-test-b/foo'
    });
    const file: File = {
      SourceProvider: providerA,
      Key: 'Apple.txt',
      Size: 9,
      ETag: '0a5353a3c313e216080c06097286c52f'
    };
    const expectedParams = {
      Bucket: 's3p-test-b',
      Key: 'foo/Apple.txt',
      CopySource: 's3p-test-a/Apple.txt'
    };
    const operation = await providerB.copyFile(file, 'CHANGE');

    expect(operation.file).toEqual(file);
    expect(operation.params).toEqual(expectedParams);
    expect(operation.type).toBe('COPY');
    expect(operation.reason).toBe('CHANGE');

    await operation.job();

    expect(s3Mock).toHaveReceivedCommandWith(CopyObjectCommand, expectedParams);
  });

  test('copyFile: delegate', async () => {
    const providerA = new S3Provider({
      root: 's3://s3p-test-a'
    });
    const providerB = new S3Provider({
      root: 's3://s3p-test-b/foo',
      delegate: {
        copyFileParams: (file, params) =>
          Promise.resolve({ ...params, Bucket: 's3p-test-c' })
      }
    });
    const file: File = {
      SourceProvider: providerA,
      Key: 'Apple.txt',
      Size: 9,
      ETag: '0a5353a3c313e216080c06097286c52f'
    };
    const expectedParams = {
      Bucket: 's3p-test-c',
      Key: 'foo/Apple.txt',
      CopySource: 's3p-test-a/Apple.txt'
    };
    const operation = await providerB.copyFile(file, 'ADD');

    expect(operation.file).toEqual(file);
    expect(operation.params).toEqual(expectedParams);
    expect(operation.type).toBe('COPY');
    expect(operation.reason).toBe('ADD');

    await operation.job();

    expect(s3Mock).toHaveReceivedCommandWith(CopyObjectCommand, expectedParams);
  });

  test('deleteFile', async () => {
    const providerA = new S3Provider({
      root: 's3://s3p-test-a'
    });
    const providerB = new S3Provider({
      root: 's3://s3p-test-b/foo'
    });
    const file: File = {
      SourceProvider: providerA,
      Key: 'Apple.txt',
      Size: 9,
      ETag: '0a5353a3c313e216080c06097286c52f'
    };
    const expectedParams = {
      Bucket: 's3p-test-b',
      Key: 'foo/Apple.txt'
    };
    const operation = await providerB.deleteFile(file);

    expect(operation.file).toEqual(file);
    expect(operation.params).toEqual(expectedParams);
    expect(operation.type).toBe('DELETE');
    expect(operation.reason).toBeUndefined();

    await operation.job();

    expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, expectedParams);
  });

  test('deleteFile: delegate', async () => {
    const providerA = new S3Provider({
      root: 's3://s3p-test-a'
    });
    const providerB = new S3Provider({
      root: 's3://s3p-test-b/foo',
      delegate: {
        deleteFileParams: (file, params) =>
          Promise.resolve({ ...params, Bucket: 's3p-test-c' })
      }
    });
    const file: File = {
      SourceProvider: providerA,
      Key: 'Apple.txt',
      Size: 9,
      ETag: '0a5353a3c313e216080c06097286c52f'
    };
    const expectedParams = {
      Bucket: 's3p-test-c',
      Key: 'foo/Apple.txt'
    };
    const operation = await providerB.deleteFile(file);

    expect(operation.file).toEqual(file);
    expect(operation.params).toEqual(expectedParams);
    expect(operation.type).toBe('DELETE');
    expect(operation.reason).toBeUndefined();

    await operation.job();

    expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, expectedParams);
  });
});
