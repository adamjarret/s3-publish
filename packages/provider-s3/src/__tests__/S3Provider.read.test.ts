import { Readable } from 'stream';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { File, FileMap, Provider } from '@s3-publish/core';
import { streamToString } from '@s3-publish/core/lib/__mock__/__util__/streamToString';
import { S3Provider } from '../S3Provider';
import { S3Object } from '../types';
import createFileFromS3Object from '../util/createFileFromS3Object';

import list_b_fixture from '../__mock__/list-objects-v2.s3p-test-b.json';
import list_b_p1_fixture from '../__mock__/list-objects-v2.s3p-test-b.p1.json';
import list_b_p2_fixture from '../__mock__/list-objects-v2.s3p-test-b.p2.json';

const list_b_fixture_parsed = {
  ...list_b_fixture,
  Contents: list_b_fixture.Contents.map(parseS3Object)
};

const list_b_p1_fixture_parsed = {
  ...list_b_p1_fixture,
  Contents: list_b_p1_fixture.Contents.map(parseS3Object)
};

const list_b_p2_fixture_parsed = {
  ...list_b_p2_fixture,
  Contents: list_b_p2_fixture.Contents.map(parseS3Object)
};

function parseS3Object(item: typeof list_b_fixture['Contents'][0]) {
  return {
    ...item,
    LastModified: new Date(Date.parse(item.LastModified))
  };
}

function createFileMapReducer(
  SourceProvider: Provider,
  Prefix: string
): FileMapReducer<FileMap> {
  return (agg: FileMap, obj: S3Object) => {
    const file = createFileFromS3Object(obj, SourceProvider, Prefix);
    if (file) {
      agg.set(file.Key, file);
    }
    return agg;
  };
}

function createFileArrayReducer(
  SourceProvider: Provider,
  Prefix: string
): FileMapReducer<File[]> {
  return (agg: File[], obj: S3Object) => {
    const file = createFileFromS3Object(obj, SourceProvider, Prefix);
    if (file) {
      agg.push(file);
    }
    return agg;
  };
}

type FileMapReducer<T> = (agg: T, obj: S3Object) => T;

const s3Mock = mockClient(S3Client);

describe('S3Provider.read', () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  test('options: custom client', async () => {
    const fixtures = list_b_fixture_parsed;
    s3Mock.on(ListObjectsV2Command).resolves(fixtures);

    const provider = new S3Provider({
      root: 's3://s3p-mock-b',
      client: new S3Client({ region: 'us-west-2' })
    });
    const actual = await provider.listFiles();

    const files: S3Object[] = fixtures.Contents;
    const expected = files.reduce(createFileMapReducer(provider, ''), new Map());

    expect(actual).toEqual(expected);
  });

  test('listFiles', async () => {
    const fixtures = list_b_fixture_parsed;
    s3Mock.on(ListObjectsV2Command).resolves(fixtures);

    const provider = new S3Provider({
      root: 's3://s3p-mock-b'
    });
    const actual = await provider.listFiles();

    const files: S3Object[] = fixtures.Contents;
    const expected = files.reduce(createFileMapReducer(provider, ''), new Map());

    expect(actual).toEqual(expected);
  });

  test('listFiles: paginated', async () => {
    s3Mock
      .on(ListObjectsV2Command)
      .resolves(list_b_p1_fixture_parsed)
      .on(ListObjectsV2Command, {
        ContinuationToken: list_b_p1_fixture_parsed.NextContinuationToken
      })
      .resolves(list_b_p2_fixture_parsed);

    const provider = new S3Provider({
      root: 's3://s3p-mock-b'
    });
    const actual = await provider.listFiles();

    const files: S3Object[] = list_b_fixture_parsed.Contents;
    const expected = files.reduce(createFileMapReducer(provider, ''), new Map());

    expect(actual).toEqual(expected);
  });

  test('listFiles: prefix', async () => {
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
    s3Mock.on(ListObjectsV2Command).resolves({ Contents: files });

    const provider = new S3Provider({
      root: 's3://s3p-test-a/foo'
    });

    const actual = await provider.listFiles();

    expect(actual.size).toBe(1);

    expect(actual.get('Apple.txt')).toEqual(
      createFileFromS3Object({ ...files[1], Key: 'Apple.txt' }, provider, 'foo')
    );
  });

  test('listFiles: prefix with trailing slash', async () => {
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
    s3Mock.on(ListObjectsV2Command).resolves({ Contents: files });

    const provider = new S3Provider({
      root: 's3://s3p-test-a/foo/'
    });

    const actual = await provider.listFiles();

    expect(actual.size).toBe(1);

    expect(actual.get('Apple.txt')).toEqual(
      createFileFromS3Object({ ...files[1], Key: 'Apple.txt' }, provider, 'foo/')
    );
  });

  test('listFiles: onIgnore', async () => {
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
    s3Mock.on(ListObjectsV2Command).resolves({ Contents: files });

    const provider = new S3Provider({
      root: 's3://s3p-test-a',
      ignores: (file) => file.Key.endsWith('.txt')
    });
    const expectedIgnoredFiles = files.reduce(createFileArrayReducer(provider, ''), []);

    expect(await provider.listFiles(onIgnore)).toEqual(new Map());

    expect(onIgnore).toHaveBeenNthCalledWith(1, expectedIgnoredFiles[0]);

    expect(onIgnore).toHaveBeenNthCalledWith(2, expectedIgnoredFiles[1]);
  });

  test('listFiles: missing Key', async () => {
    const files: S3Object[] = [
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
    s3Mock.on(ListObjectsV2Command).resolves({ Contents: files });

    const provider = new S3Provider({
      root: 's3://s3p-test-a'
    });

    const actual = await provider.listFiles();

    expect(actual.size).toBe(1);

    expect(actual.get('Apple.txt')).toEqual(
      createFileFromS3Object(files[0], provider, '')
    );
  });

  test('listFiles: missing ETag', async () => {
    const files = [
      {
        Key: 'Apple.txt',
        LastModified: new Date('2020-01-01T06:42:17'),
        Size: 9
      }
    ];
    s3Mock.on(ListObjectsV2Command).resolves({ Contents: files });

    const provider = new S3Provider({
      root: 's3://s3p-test-a'
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

  test('listFiles: invalid S3 URL', async () => {
    const provider = new S3Provider({
      root: 's3p-test-a'
    });

    try {
      await provider.listFiles();
      throw new Error('Did not throw');
    } catch (error) {
      expect(error.message).toBe('Invalid S3 URL');
    }
  });

  test('listFiles: delegate', async () => {
    const files: S3Object[] = [
      {
        Key: 'Apple.txt',
        LastModified: new Date('2020-01-01T06:42:17'),
        Size: 9,
        ETag: '"0a5353a3c313e216080c06097286c52f"'
      }
    ];
    s3Mock.on(ListObjectsV2Command).resolves({ Contents: files });

    const provider = new S3Provider({
      root: 's3://s3p-test-a',
      delegate: {
        listFilesParams: (params) => Promise.resolve({ ...params, MaxKeys: 5 })
      }
    });
    const expected = files.reduce(createFileMapReducer(provider, ''), new Map());

    expect(await provider.listFiles()).toEqual(expected);

    expect(s3Mock).toHaveReceivedCommandWith(ListObjectsV2Command, {
      Bucket: 's3p-test-a',
      Prefix: '',
      MaxKeys: 5,
      ContinuationToken: undefined
    });
  });

  // ---

  test('getFile', async () => {
    s3Mock.on(GetObjectCommand).resolves({
      Body: Readable.from(['Apple.txt']),
      ETag: '"0a5353a3c313e216080c06097286c52f"'
    });

    const provider = new S3Provider({
      root: 's3://s3p-test-a'
    });
    const file: File = {
      SourceProvider: provider,
      Key: 'Apple.txt',
      Size: 9,
      ETag: '0a5353a3c313e216080c06097286c52f'
    };

    expect(await streamToString(await provider.getFile(file))).toBe('Apple.txt');

    expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {
      Bucket: 's3p-test-a',
      Key: 'Apple.txt'
    });
  });

  test('getFile: delegate', async () => {
    s3Mock.on(GetObjectCommand).resolves({
      Body: Readable.from(['hello']),
      ETag: '"0a5353a3c313e216080c06097286c52f"'
    });

    const provider = new S3Provider({
      root: 's3://s3p-test-a',
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

    expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {
      Bucket: 's3p-test-c',
      Key: 'Apple.txt'
    });
  });

  test('getFile: invalid stream', async () => {
    s3Mock.on(GetObjectCommand).resolves({
      Body: undefined,
      ETag: '"0a5353a3c313e216080c06097286c52f"'
    });

    const provider = new S3Provider({
      root: 's3://s3p-test-a'
    });
    const file: File = {
      SourceProvider: provider,
      Key: 'Apple.txt',
      Size: 9,
      ETag: '0a5353a3c313e216080c06097286c52f'
    };

    try {
      await provider.getFile(file);
      throw new Error('Did not throw');
    } catch (error) {
      expect(error.message).toMatch(/Unknown object stream type/);
    }

    expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {
      Bucket: 's3p-test-a',
      Key: 'Apple.txt'
    });
  });

  test('getFileETag', async () => {
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

  test('getFileETag: missing', async () => {
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

  test('getTargetFileKey', async () => {
    const provider = new S3Provider({
      root: 's3://s3p-test-a'
    });
    const file: File = {
      SourceProvider: provider,
      Key: 'Apple.txt'
    };

    expect(await provider.getTargetFileKey(file)).toBe(file.Key);
  });

  test('getTargetFileKey: delegate', async () => {
    const provider = new S3Provider({
      root: 's3://s3p-test-a',
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
});
