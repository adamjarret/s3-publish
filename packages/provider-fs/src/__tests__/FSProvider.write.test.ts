import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { File } from '@s3-publish/core';
import rimraf from 'rimraf';
import { FSProvider } from '../FSProvider';
import { Readable } from 'stream';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const root = path.resolve(__dirname, '__fixtures__', 'root');
const tmp = path.resolve(__dirname, '__tmp__', 'FSProvider');

class FSProviderBadFile extends FSProvider {
  getFile(): Promise<Readable> {
    // @ts-ignore
    return Promise.resolve(null);
  }
}

describe('FSProvider: write', () => {
  beforeAll(() => {
    rimraf.sync(`${root}/**/.DS_Store`);
  });

  beforeEach(() => {
    jest.resetModules(); // this is important - it clears the cache
    jest.restoreAllMocks(); // restore spyOn mocks
    rimraf.sync(tmp);
    fs.mkdirSync(tmp);
  });

  test('FSProvider.putFile', async () => {
    const filePath = path.resolve(tmp, 'Apple.txt');
    const providerA = new FSProvider({ root });
    const providerB = new FSProvider({ root: tmp });
    const file: File = { SourceProvider: providerA, Key: 'Apple.txt' };
    const operation = await providerB.putFile(file, 'CHANGE');

    expect(operation.file).toEqual(file);
    expect(operation.params).toEqual({ filePath });
    expect(operation.type).toBe('PUT');
    expect(operation.reason).toBe('CHANGE');
    expect(fs.existsSync(filePath)).toBe(false);

    await operation.job();

    expect(fs.existsSync(filePath)).toBe(true);
    expect(await readFile(filePath, 'utf8')).toBe('Apple.txt');
  });

  test('FSProvider.putFile: delegate', async () => {
    const filePath = path.resolve(tmp, 'foo.txt');
    const providerA = new FSProvider({ root });
    const providerB = new FSProvider({
      root: tmp,
      delegate: {
        putFileParams: (file, params) => Promise.resolve({ ...params, filePath })
      }
    });
    const file: File = { SourceProvider: providerA, Key: 'Apple.txt' };
    const operation = await providerB.putFile(file, 'ADD');

    expect(operation.file).toEqual(file);
    expect(operation.params).toEqual({ filePath });
    expect(operation.type).toBe('PUT');
    expect(operation.reason).toBe('ADD');
    expect(fs.existsSync(filePath)).toBe(false);

    await operation.job();

    expect(fs.existsSync(filePath)).toBe(true);
    expect(await readFile(filePath, 'utf8')).toBe('Apple.txt');
  });

  test('FSProvider.putFile: delegate with body', async () => {
    const filePath = path.resolve(tmp, 'foo.txt');
    const providerA = new FSProvider({ root });
    const providerB = new FSProvider({
      root: tmp,
      delegate: {
        putFileParams: (file, params) =>
          Promise.resolve({ ...params, filePath, body: Readable.from(['hello']) })
      }
    });
    const file: File = { SourceProvider: providerA, Key: 'Apple.txt' };
    const operation = await providerB.putFile(file, 'ADD');

    expect(operation.file).toEqual(file);
    expect(operation.params).toMatchObject({ filePath });
    expect(operation.type).toBe('PUT');
    expect(operation.reason).toBe('ADD');
    expect(fs.existsSync(filePath)).toBe(false);

    await operation.job();

    expect(fs.existsSync(filePath)).toBe(true);
    expect(await readFile(filePath, 'utf8')).toBe('hello');
  });

  test('FSProvider.putFile: missing body', async () => {
    const filePath = path.resolve(tmp, 'nobody.txt');
    const providerA = new FSProviderBadFile({ root });
    const providerB = new FSProvider({ root: tmp });
    const file: File = { SourceProvider: providerA, Key: 'nobody.txt' };
    const operation = await providerB.putFile(file, 'ADD');

    expect(operation.file).toEqual(file);
    expect(operation.params).toMatchObject({ filePath });
    expect(operation.type).toBe('PUT');
    expect(operation.reason).toBe('ADD');
    expect(fs.existsSync(filePath)).toBe(false);

    try {
      await operation.job();

      throw new Error('Did not throw');
    } catch (error) {
      expect(error.message).toMatch(/Missing body/);
    }
  });

  test('FSProvider.copyFile', async () => {
    const toPath = path.resolve(tmp, 'Apple.txt');
    const providerA = new FSProvider({ root });
    const providerB = new FSProvider({ root: tmp });
    const file: File = { SourceProvider: providerA, Key: 'Apple.txt' };
    const operation = await providerB.copyFile(file, 'CHANGE');

    expect(operation.file).toEqual(file);
    expect(operation.params).toEqual({
      toPath,
      fromPath: path.resolve(root, 'Apple.txt'),
      flags: 0
    });
    expect(operation.type).toBe('COPY');
    expect(operation.reason).toBe('CHANGE');
    expect(fs.existsSync(toPath)).toBe(false);

    await operation.job();

    expect(fs.existsSync(toPath)).toBe(true);
    expect(await readFile(toPath, 'utf8')).toBe('Apple.txt');
  });

  test('FSProvider.copyFile: delegate', async () => {
    const toPath = path.resolve(tmp, 'foo.txt');
    const providerA = new FSProvider({ root });
    const providerB = new FSProvider({
      root: tmp,
      delegate: {
        copyFileParams: (file, params) =>
          Promise.resolve({
            ...params,
            toPath,
            dirMode: 0o700,
            flags: fs.constants.COPYFILE_EXCL
          })
      }
    });
    const file: File = { SourceProvider: providerA, Key: 'Apple.txt' };
    const operation = await providerB.copyFile(file, 'ADD');

    expect(operation.file).toEqual(file);
    expect(operation.params).toEqual({
      toPath,
      fromPath: path.resolve(root, 'Apple.txt'),
      flags: fs.constants.COPYFILE_EXCL,
      dirMode: 0o700
    });
    expect(operation.type).toBe('COPY');
    expect(operation.reason).toBe('ADD');
    expect(fs.existsSync(toPath)).toBe(false);

    await operation.job();

    expect(fs.existsSync(toPath)).toBe(true);
    expect(await readFile(toPath, 'utf8')).toBe('Apple.txt');
  });

  test('FSProvider.deleteFile', async () => {
    const filePath = path.resolve(tmp, 'Apple.txt');
    const provider = new FSProvider({ root: tmp });
    const file: File = { SourceProvider: provider, Key: 'Apple.txt' };
    const operation = await provider.deleteFile(file);

    expect(operation.file).toEqual(file);
    expect(operation.params).toEqual({ filePath });
    expect(operation.type).toBe('DELETE');
    expect(operation.reason).toBeUndefined();
    expect(fs.existsSync(filePath)).toBe(false);

    await writeFile(filePath, '--TO DELETE--', 'utf8');

    expect(fs.existsSync(filePath)).toBe(true);

    await operation.job();

    expect(fs.existsSync(filePath)).toBe(false);
  });

  test('FSProvider.deleteFile: delegate', async () => {
    const filePath = path.resolve(tmp, 'foo.txt');
    const provider = new FSProvider({
      root: tmp,
      delegate: {
        deleteFileParams: (file, params) => Promise.resolve({ ...params, filePath })
      }
    });
    const file: File = { SourceProvider: provider, Key: 'Apple.txt' };
    const operation = await provider.deleteFile(file);

    expect(operation.file).toEqual(file);
    expect(operation.params).toEqual({ filePath });
    expect(operation.type).toBe('DELETE');
    expect(operation.reason).toBeUndefined();
    expect(fs.existsSync(filePath)).toBe(false);

    await writeFile(filePath, '--TO DELETE--', 'utf8');

    expect(fs.existsSync(filePath)).toBe(true);

    await operation.job();

    expect(fs.existsSync(filePath)).toBe(false);
  });

  test('FSProvider.deleteFile: non-existent', async () => {
    const filePath = path.resolve(tmp, 'does-not-exist.txt');
    const provider = new FSProvider({ root: tmp });
    const file: File = { SourceProvider: provider, Key: 'does-not-exist.txt' };
    const operation = await provider.deleteFile(file);

    expect(fs.existsSync(filePath)).toBe(false);

    await operation.job();

    expect(fs.existsSync(filePath)).toBe(false);
  });

  test('FSProvider.deleteFile: unknown error', async () => {
    jest.spyOn(fs.promises, 'unlink').mockImplementation(() => {
      throw new Error('Unknown error');
    });

    const filePath = path.resolve(tmp, 'does-not-exist.txt');
    const provider = new FSProvider({ root: tmp });
    const file: File = { SourceProvider: provider, Key: 'does-not-exist.txt' };
    const operation = await provider.deleteFile(file);

    expect(fs.existsSync(filePath)).toBe(false);

    try {
      await operation.job();
      throw new Error('Did not throw');
    } catch (error) {
      expect(error.message).toMatch(/Unknown error/);
    }
  });

  // END describe
});
