import { Readable } from 'stream';
import { File, FileMap, Provider, FileWithoutProvider } from '@s3-publish/core';
import { S3Provider } from '../S3Provider';
import { MockS3Bridge } from '../__mock__/MockS3Bridge';
import { streamToString } from '@s3-publish/core/lib/__mock__/__util__/streamToString';

type FileMapReducer<T> = (agg: T, file: FileWithoutProvider) => T;

function createFileMapReducer(SourceProvider: Provider): FileMapReducer<FileMap> {
  const createFile = fakeCreateFile(SourceProvider);
  return (agg: FileMap, file: FileWithoutProvider) => {
    agg.set(file.Key, createFile(file));
    return agg;
  };
}

function createFileArrayReducer(SourceProvider: Provider): FileMapReducer<File[]> {
  const createFile = fakeCreateFile(SourceProvider);
  return (agg: File[], file: FileWithoutProvider) => {
    agg.push(createFile(file));
    return agg;
  };
}

function fakeCreateFile(SourceProvider: Provider) {
  return (file: FileWithoutProvider): File => ({
    ...file,
    ETag: file.ETag?.replace(/"/g, ''),
    SourceProvider
  });
}

test('S3Provider.listFiles', async () => {
  const files: FileWithoutProvider[] = [
    {
      Key: 'Apple.txt',
      LastModified: new Date('2020-01-01T06:42:17'),
      Size: 9,
      ETag: '"0a5353a3c313e216080c06097286c52f"'
    }
  ];
  const provider = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge({ files })
  });
  const expected = files.reduce(createFileMapReducer(provider), new Map());

  expect(await provider.listFiles()).toEqual(expected);
});

test('S3Provider.listFiles: prefix', async () => {
  const files = [
    {
      Key: 'foo/',
      LastModified: new Date('2020-01-01T06:42:17'),
      Size: 0,
      ETag: '"d41d8cd98f00b204e9800998ecf8427e"'
    },
    {
      Key: 'foo/Apple.txt',
      LastModified: new Date('2020-01-01T06:42:17'),
      Size: 9,
      ETag: '"0a5353a3c313e216080c06097286c52f"'
    }
  ];
  const provider = new S3Provider({
    root: 's3://s3p-test-a/foo',
    bridge: new MockS3Bridge({ files })
  });
  const createFile = fakeCreateFile(provider);

  expect(await provider.listFiles()).toEqual(
    new Map([['Apple.txt', createFile({ ...files[1], Key: 'Apple.txt' })]])
  );
});

test('S3Provider.listFiles: onIgnore', async () => {
  const onIgnore = jest.fn();
  const files = [
    {
      Key: 'Apple.txt',
      LastModified: new Date('2020-01-01T06:42:17'),
      Size: 9,
      ETag: '"0a5353a3c313e216080c06097286c52f"'
    },
    {
      Key: 'ace.txt',
      LastModified: new Date('2020-01-01T06:42:17'),
      Size: 7,
      ETag: '"353274e173aabffd4138c8db40c6fdec"'
    }
  ];
  const provider = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge({ files }),
    ignores: (file) => file.Key.endsWith('.txt')
  });
  const expectedIgnoredFiles = files.reduce(createFileArrayReducer(provider), []);

  expect(await provider.listFiles(onIgnore)).toEqual(new Map());

  expect(onIgnore).toHaveBeenNthCalledWith(1, expectedIgnoredFiles[0]);

  expect(onIgnore).toHaveBeenNthCalledWith(2, expectedIgnoredFiles[1]);
});

test('S3Provider.listFiles: missing Key', async () => {
  const files: FileWithoutProvider[] = [
    {
      Key: 'Apple.txt',
      LastModified: new Date('2020-01-01T06:42:17'),
      Size: 9,
      ETag: '"0a5353a3c313e216080c06097286c52f"'
    },
    // @ts-ignore Key cannot be undefined
    {
      LastModified: new Date('2020-01-01T06:42:17'),
      Size: 7,
      ETag: '"353274e173aabffd4138c8db40c6fdec"'
    }
  ];
  const provider = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge({ files })
  });
  const createFile = fakeCreateFile(provider);

  expect(await provider.listFiles()).toEqual(
    new Map([[files[0].Key, createFile(files[0])]])
  );
});

test('S3Provider.listFiles: missing ETag', async () => {
  const files = [
    {
      Key: 'Apple.txt',
      LastModified: new Date('2020-01-01T06:42:17'),
      Size: 9
    }
  ];
  const provider = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge({ files })
  });

  expect(await provider.listFiles()).toEqual(
    new Map([
      [
        files[0].Key,
        {
          ...files[0],
          ETag: undefined,
          SourceProvider: provider
        }
      ]
    ])
  );
});

test('S3Provider.listFiles: invalid S3 URL', async () => {
  const provider = new S3Provider({
    root: 's3p-test-a',
    bridge: new MockS3Bridge()
  });

  try {
    await provider.listFiles();
    throw new Error('Did not throw');
  } catch (error) {
    expect(error.message).toBe('Invalid S3 URL');
  }
});

test('S3Provider.listFiles: delegate', async () => {
  const onWalkObjects = jest.fn();
  const files: FileWithoutProvider[] = [
    {
      Key: 'Apple.txt',
      LastModified: new Date('2020-01-01T06:42:17'),
      Size: 9,
      ETag: '"0a5353a3c313e216080c06097286c52f"'
    }
  ];
  const provider = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge({ files, onWalkObjects }),
    delegate: {
      listFilesParams: (params) => Promise.resolve({ ...params, MaxKeys: 5 })
    }
  });
  const expected = files.reduce(createFileMapReducer(provider), new Map());

  expect(await provider.listFiles()).toEqual(expected);

  expect(onWalkObjects).toHaveBeenCalledWith({
    Bucket: 's3p-test-a',
    Prefix: '',
    MaxKeys: 5
  });
});

test('S3Provider.getFile', async () => {
  const onGetObject = jest.fn((params) => Readable.from([params.Key]));
  const provider = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge({ onGetObject })
  });
  const file: File = {
    SourceProvider: provider,
    Key: 'Apple.txt',
    Size: 9,
    ETag: '0a5353a3c313e216080c06097286c52f'
  };

  expect(await streamToString(await provider.getFile(file))).toBe('Apple.txt');

  expect(onGetObject).toHaveBeenCalledWith({
    Bucket: 's3p-test-a',
    Key: 'Apple.txt'
  });
});

test('S3Provider.getFile: delegate', async () => {
  const onGetObject = jest.fn(() => Readable.from(['hello']));
  const provider = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge({ onGetObject }),
    delegate: {
      getFileParams: (file, params) =>
        Promise.resolve({ ...params, Bucket: 's3p-test-c' })
    }
  });
  const file: File = {
    SourceProvider: provider,
    Key: 'Apple.txt',
    Size: 9,
    ETag: '0a5353a3c313e216080c06097286c52f'
  };

  expect(await streamToString(await provider.getFile(file))).toBe('hello');

  expect(onGetObject).toHaveBeenCalledWith({
    Bucket: 's3p-test-c',
    Key: 'Apple.txt'
  });
});

test('S3Provider.getFileETag', async () => {
  const provider = new S3Provider({
    root: 's3://s3p-test-a'
  });
  const file: File = {
    SourceProvider: provider,
    Key: 'Apple.txt',
    Size: 9,
    ETag: '0a5353a3c313e216080c06097286c52f'
  };

  expect(await provider.getFileETag(file)).toBe(file.ETag);
});

test('S3Provider.getFileETag: missing', async () => {
  const provider = new S3Provider({
    root: 's3://s3p-test-a'
  });
  const file: File = {
    SourceProvider: provider,
    Key: 'Apple.txt',
    Size: 9
  };

  try {
    await provider.getFileETag(file);
    throw new Error('Did not throw');
  } catch (error) {
    expect(error.message).toMatch(/Missing ETag/);
  }
});

test('S3Provider.getTargetFileKey', async () => {
  const provider = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge()
  });
  const file: File = {
    SourceProvider: provider,
    Key: 'Apple.txt'
  };

  expect(await provider.getTargetFileKey(file)).toBe(file.Key);
});

test('S3Provider.getTargetFileKey: delegate', async () => {
  const provider = new S3Provider({
    root: 's3://s3p-test-a',
    bridge: new MockS3Bridge(),
    delegate: {
      targetFileKey: (file) => Promise.resolve(`${file.Key}.0`)
    }
  });
  const file: File = {
    SourceProvider: provider,
    Key: 'Apple.txt'
  };

  expect(await provider.getTargetFileKey(file)).toBe('Apple.txt.0');
});
