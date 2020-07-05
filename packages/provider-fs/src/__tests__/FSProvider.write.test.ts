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

describe('FSProvider: write', () => {
  beforeAll(() => {
    rimraf.sync(`${root}/**/.DS_Store`);
  });

  beforeEach(() => {
    jest.resetModules(); // this is important - it clears the cache
    rimraf.sync(tmp);
    fs.mkdirSync(tmp);
  });

  afterEach(() => {
    rimraf.sync(tmp);
  });

  test('FSProvider.putFile', async (done) => {
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

    done();
  });

  test('FSProvider.putFile: delegate', async (done) => {
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

    done();
  });

  test('FSProvider.putFile: delegate with body', async (done) => {
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

    done();
  });

  test('FSProvider.copyFile', async (done) => {
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

    done();
  });

  test('FSProvider.copyFile: delegate', async (done) => {
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

    done();
  });

  test('FSProvider.deleteFile', async (done) => {
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

    done();
  });

  test('FSProvider.deleteFile: delegate', async (done) => {
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

    done();
  });

  // END describe
});
