import path from 'path';
import rimraf from 'rimraf';
import { File } from '@s3-publish/core';
import { streamToString } from '@s3-publish/core/lib/__mock__/__util__/streamToString';
import { FSProvider } from '../FSProvider';

const root = path.resolve(__dirname, '__fixtures__', 'root');

class FSProviderBadMD5 extends FSProvider {
  getMD5FromReadStream(): Promise<string> {
    return Promise.resolve('');
  }
}

describe('FSProvider: read', () => {
  beforeAll(() => {
    rimraf.sync(`${root}/**/.DS_Store`);
  });

  test('FSProvider', () => {
    const provider = new FSProvider({ root });

    expect(provider.protocol).toBe('file');
    expect(provider.root).toBe(root);
  });

  test('FSProvider.listFiles', async () => {
    const provider = new FSProvider({ root });
    const result = await provider.listFiles();

    expect(result.size).toBe(7);

    let i = 0;
    result.forEach((value) => {
      switch (i) {
        case 0:
          expect(value).toMatchObject({
            SourceProvider: provider,
            Key: 'Apple.txt',
            Size: 9
          });
          expect(value.ETag).toBeUndefined();
          expect(value.LastModified).toBeDefined();
          break;

        case 1:
          expect(value).toMatchObject({
            SourceProvider: provider,
            Key: 'ace.txt',
            Size: 7
          });
          expect(value.ETag).toBeUndefined();
          expect(value.LastModified).toBeDefined();
          break;

        case 2:
          expect(value).toMatchObject({
            SourceProvider: provider,
            Key: 'docs/about.md',
            Size: 0
          });
          expect(value.ETag).toBeUndefined();
          expect(value.LastModified).toBeDefined();
          break;

        case 3:
          expect(value).toMatchObject({
            SourceProvider: provider,
            Key: 'docs/assets/image.jpg',
            Size: 220399
          });
          expect(value.ETag).toBeUndefined();
          expect(value.LastModified).toBeDefined();
          break;

        case 4:
          expect(value).toMatchObject({
            SourceProvider: provider,
            Key: 'docs/assets/styles.css',
            Size: 0
          });
          expect(value.ETag).toBeUndefined();
          expect(value.LastModified).toBeDefined();
          break;

        case 5:
          expect(value).toMatchObject({
            SourceProvider: provider,
            Key: 'docs/getting-started.md',
            Size: 0
          });
          expect(value.ETag).toBeUndefined();
          expect(value.LastModified).toBeDefined();
          break;

        case 6:
          expect(value).toMatchObject({
            SourceProvider: provider,
            Key: 'docs/tmp/out.bak',
            Size: 0
          });
          expect(value.ETag).toBeUndefined();
          expect(value.LastModified).toBeDefined();
          break;
      }
      i++;
    });
  });

  test('FSProvider.listFiles: ignores', async () => {
    const provider = new FSProvider({
      root,
      ignores: (file) => file.Key.endsWith('.css') || file.Key === 'ace.txt'
    });
    const onIgnore = jest.fn();
    const result = await provider.listFiles(onIgnore);

    expect(result.size).toBe(5);
    expect(onIgnore).toHaveBeenCalledTimes(2);

    let i = 0;
    result.forEach((value) => {
      switch (i) {
        case 0:
          expect(value).toMatchObject({
            SourceProvider: provider,
            Key: 'Apple.txt',
            Size: 9
          });
          expect(value.ETag).toBeUndefined();
          expect(value.LastModified).toBeDefined();
          break;

        case 1:
          expect(value).toMatchObject({
            SourceProvider: provider,
            Key: 'docs/about.md',
            Size: 0
          });
          expect(value.ETag).toBeUndefined();
          expect(value.LastModified).toBeDefined();
          break;

        case 2:
          expect(value).toMatchObject({
            SourceProvider: provider,
            Key: 'docs/assets/image.jpg',
            Size: 220399
          });
          expect(value.ETag).toBeUndefined();
          expect(value.LastModified).toBeDefined();
          break;

        case 3:
          expect(value).toMatchObject({
            SourceProvider: provider,
            Key: 'docs/getting-started.md',
            Size: 0
          });
          expect(value.ETag).toBeUndefined();
          expect(value.LastModified).toBeDefined();
          break;

        case 4:
          expect(value).toMatchObject({
            SourceProvider: provider,
            Key: 'docs/tmp/out.bak',
            Size: 0
          });
          expect(value.ETag).toBeUndefined();
          expect(value.LastModified).toBeDefined();
          break;
      }
      i++;
    });
  });

  test('FSProvider.listFiles: ignores directory', async () => {
    const provider = new FSProvider({
      root,
      ignores: (file) => file.Key === 'docs'
    });
    const onIgnore = jest.fn();
    const result = await provider.listFiles(onIgnore);

    expect(result.size).toBe(2);
    expect(onIgnore).toHaveBeenCalledTimes(1);

    let i = 0;
    result.forEach((value) => {
      switch (i) {
        case 0:
          expect(value).toMatchObject({
            SourceProvider: provider,
            Key: 'Apple.txt',
            Size: 9
          });
          expect(value.ETag).toBeUndefined();
          expect(value.LastModified).toBeDefined();
          break;

        case 1:
          expect(value).toMatchObject({
            SourceProvider: provider,
            Key: 'ace.txt',
            Size: 7
          });
          expect(value.ETag).toBeUndefined();
          expect(value.LastModified).toBeDefined();
          break;
      }
      i++;
    });
  });

  test('FSProvider.listFiles: non-existent', async () => {
    const provider = new FSProvider({ root: path.resolve(root, 'nope') });

    try {
      await provider.listFiles();
      throw new Error('Did not throw');
    } catch (error) {
      expect(error.message).toMatch(/not found/);
    }
  });

  test('FSProvider.listFiles: empty', async () => {
    const provider = new FSProvider({ root: '' });

    try {
      await provider.listFiles();
      throw new Error('Did not throw');
    } catch (error) {
      expect(error.message).toMatch(/Missing root/);
    }
  });

  // Non-delegate is covered by getFileETag test
  test('FSProvider.getFile: delegate', async () => {
    const getFileParams = jest.fn((file, params) =>
      Promise.resolve({ ...params, filePath: path.resolve(root, 'ace.txt') })
    );
    const provider = new FSProvider({
      root,
      delegate: { getFileParams }
    });
    const file: File = {
      SourceProvider: provider,
      Key: 'Apple.txt'
    };

    const result = await provider.getFile(file);

    expect(await streamToString(result)).toBe('ace.txt');

    expect(getFileParams).toHaveBeenCalledWith(file, {
      filePath: path.resolve(root, file.Key)
    });
  });

  test('FSProvider.getFileCopySource', async () => {
    const provider = new FSProvider({ root });
    const result = await provider.getFileCopySource({
      SourceProvider: provider,
      Key: 'Apple.txt'
    });

    expect(result).toBe(path.resolve(root, 'Apple.txt'));
  });

  test('FSProvider.getFileETag', async () => {
    const provider = new FSProvider({ root });
    const file: File = { SourceProvider: provider, Key: 'Apple.txt' };
    const result = await provider.getFileETag(file);
    const expected = '0a5353a3c313e216080c06097286c52f';

    expect(result).toBe(expected);
    expect(file.ETag).toBe(expected);

    const again = await provider.getFileETag(file);

    expect(again).toBe(expected);
    expect(file.ETag).toBe(expected);
  });

  test('FSProvider.getFileETag: null', async () => {
    const provider = new FSProviderBadMD5({ root });

    try {
      await provider.getFileETag({ SourceProvider: provider, Key: 'Apple.txt' });
      throw new Error('Did not throw');
    } catch (error) {
      expect(error.message).toMatch(/Missing ETag/);
    }
  });

  test('FSProvider.getTargetFileKey', async () => {
    const provider = new FSProvider({ root });
    const result = await provider.getTargetFileKey({
      SourceProvider: provider,
      Key: 'Apple.txt'
    });

    expect(result).toBe('Apple.txt');
  });

  test('FSProvider.getTargetFileKey: delegate', async () => {
    const provider = new FSProvider({
      root,
      delegate: { targetFileKey: (file) => Promise.resolve(`${file.Key}.0`) }
    });
    const result = await provider.getTargetFileKey({
      SourceProvider: provider,
      Key: 'Apple.txt'
    });

    expect(result).toBe('Apple.txt.0');
  });

  // END describe
});
