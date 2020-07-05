import { Readable } from 'stream';
import { File } from '@s3-publish/core';
import { MockProvider } from '@s3-publish/core/lib/__mock__/MockProvider';
import { streamToString } from '@s3-publish/core/lib/__mock__/__util__/streamToString';
import { S3Provider } from '../S3Provider';
import { MockS3Bridge } from '../__mock__/MockS3Bridge';

test('S3Provider.putFile', async (done) => {
  const onPutObject = jest.fn(async (params) => {
    expect(params).toMatchObject(expectedParams);
    expect(await streamToString(params.Body)).toBe('Apple.txt');
    return {};
  });
  const providerA = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge()
  });
  const providerB = new S3Provider({
    root: 's3://s3p-test-b/foo',
    bridge: new MockS3Bridge({ onPutObject })
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

  expect(onPutObject).toHaveBeenCalledTimes(1);

  done();
});

test('S3Provider.putFile: delegate', async (done) => {
  const onPutObject = jest.fn(async (params) => {
    expect(params).toMatchObject(expectedParams);
    expect(await streamToString(params.Body)).toBe('Apple.txt');
    return {};
  });
  const providerA = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge()
  });
  const providerB = new S3Provider({
    root: 's3://s3p-test-b/foo',
    bridge: new MockS3Bridge({ onPutObject }),
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

  expect(onPutObject).toHaveBeenCalledTimes(1);

  done();
});

test('S3Provider.putFile: delegate with body', async (done) => {
  const Body = Readable.from(['hello']);
  const onPutObject = jest.fn(async (params) => {
    expect(params).toEqual(expectedParams);
    expect(await streamToString(params.Body)).toBe('hello');
    return {};
  });
  const providerA = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge()
  });
  const providerB = new S3Provider({
    root: 's3://s3p-test-b/foo',
    bridge: new MockS3Bridge({ onPutObject }),
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

  expect(onPutObject).toHaveBeenCalledTimes(1);

  done();
});

test('S3Provider.putFile: checksum=false', async (done) => {
  const onPutObject = jest.fn(async (params) => {
    expect(params).toMatchObject(expectedParams);
    expect(await streamToString(params.Body)).toBe('Apple.txt');
    return {};
  });
  const providerA = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge()
  });
  const providerB = new S3Provider({
    root: 's3://s3p-test-b/foo',
    bridge: new MockS3Bridge({ onPutObject }),
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

  expect(onPutObject).toHaveBeenCalledTimes(1);

  done();
});

test('S3Provider.putFile: checksum=false, no ETag', async (done) => {
  const onPutObject = jest.fn(async (params) => {
    expect(params).toMatchObject(expectedParams);
    expect(await streamToString(params.Body)).toBe('Apple.txt');
    return {};
  });
  const providerA = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge()
  });
  const providerB = new S3Provider({
    root: 's3://s3p-test-b/foo',
    bridge: new MockS3Bridge({ onPutObject }),
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

  expect(onPutObject).toHaveBeenCalledTimes(1);

  done();
});

test('S3Provider.putFile: checksum=true, no ETag', async (done) => {
  const onPutObject = jest.fn(async (params) => {
    expect(params).toMatchObject(expectedParams);
    expect(await streamToString(params.Body)).toBe('Apple.txt');
    return {};
  });
  const providerA = new MockProvider({
    root: 's3://s3p-test-a',
    files: [],
    onGetFileETag: (file) => {
      file.ETag = '0a5353a3c313e216080c06097286c52f';
      return Promise.resolve();
    }
  });
  const providerB = new S3Provider({
    root: 's3://s3p-test-b/foo',
    bridge: new MockS3Bridge({ onPutObject })
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
    ContentMD5: 'ClNTo8MT4hYIDAYJcobFLw==',
    ContentLength: 9
  };
  const operation = await providerB.putFile(file, 'CHANGE');

  expect(operation.file).toEqual(file);
  expect(operation.params).toEqual(expectedParams);
  expect(operation.type).toBe('PUT');
  expect(operation.reason).toBe('CHANGE');

  await operation.job();

  expect(onPutObject).toHaveBeenCalledTimes(1);

  done();
});

test('S3Provider.putFile: unknown mime type', async (done) => {
  const onPutObject = jest.fn(async (params) => {
    expect(params).toMatchObject(expectedParams);
    expect(await streamToString(params.Body)).toBe('Apple.not-a-thing');
    return {};
  });
  const providerA = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge()
  });
  const providerB = new S3Provider({
    root: 's3://s3p-test-b/foo',
    bridge: new MockS3Bridge({ onPutObject })
  });
  const file: File = {
    SourceProvider: providerA,
    Key: 'Apple.not-a-thing',
    Size: 9,
    ETag: '0a5353a3c313e216080c06097286c52f'
  };
  const expectedParams = {
    Bucket: 's3p-test-b',
    Key: 'foo/Apple.not-a-thing',
    ContentType: undefined,
    ContentMD5: 'ClNTo8MT4hYIDAYJcobFLw==',
    ContentLength: 9
  };
  const operation = await providerB.putFile(file, 'CHANGE');

  expect(operation.file).toEqual(file);
  expect(operation.params).toEqual(expectedParams);
  expect(operation.type).toBe('PUT');
  expect(operation.reason).toBe('CHANGE');

  await operation.job();

  expect(onPutObject).toHaveBeenCalledTimes(1);

  done();
});

test('S3Provider.copyFile', async (done) => {
  const onCopyObject = jest.fn();
  const providerA = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge()
  });
  const providerB = new S3Provider({
    root: 's3://s3p-test-b/foo',
    bridge: new MockS3Bridge({ onCopyObject })
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

  expect(onCopyObject).toHaveBeenCalledTimes(1);
  expect(onCopyObject).toHaveBeenCalledWith(expectedParams);

  done();
});

test('S3Provider.copyFile: delegate', async (done) => {
  const onCopyObject = jest.fn();
  const providerA = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge()
  });
  const providerB = new S3Provider({
    root: 's3://s3p-test-b/foo',
    bridge: new MockS3Bridge({ onCopyObject }),
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

  expect(onCopyObject).toHaveBeenCalledTimes(1);
  expect(onCopyObject).toHaveBeenCalledWith(expectedParams);

  done();
});

test('S3Provider.deleteFile', async (done) => {
  const onDeleteObject = jest.fn();
  const providerA = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge()
  });
  const providerB = new S3Provider({
    root: 's3://s3p-test-b/foo',
    bridge: new MockS3Bridge({ onDeleteObject })
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

  expect(onDeleteObject).toHaveBeenCalledTimes(1);
  expect(onDeleteObject).toHaveBeenCalledWith(expectedParams);

  done();
});

test('S3Provider.deleteFile: delegate', async (done) => {
  const onDeleteObject = jest.fn();
  const providerA = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge()
  });
  const providerB = new S3Provider({
    root: 's3://s3p-test-b/foo',
    bridge: new MockS3Bridge({ onDeleteObject }),
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

  expect(onDeleteObject).toHaveBeenCalledTimes(1);
  expect(onDeleteObject).toHaveBeenCalledWith(expectedParams);

  done();
});
