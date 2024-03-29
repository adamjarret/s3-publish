import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { streamToString } from '@s3-publish/core/lib/__mock__/__util__/streamToString';
import rimraf from 'rimraf';
import { FSBridge } from '../FSBridge';
import { Readable } from 'stream';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const fooMd5 = 'acbd18db4cc2f85cedef654fccc4a4d8';

describe('FSBridge', () => {
  const cwd = process.cwd();
  const tmp = path.resolve(__dirname, '__tmp__', 'FSBridge');
  const root = path.resolve(__dirname, '__fixtures__', 'root');
  const aceContent = 'ace.txt';

  beforeAll(() => {
    rimraf.sync(`${root}/**/.DS_Store`);
  });

  beforeEach(() => {
    jest.resetModules(); // this is important - it clears the cache
    rimraf.sync(tmp);
    fs.mkdirSync(tmp);
    process.chdir(tmp);
  });

  afterEach(() => {
    rimraf.sync(tmp);
    process.chdir(cwd);
  });

  test('FSBridge.listObjects', async () => {
    const bridge = new FSBridge();
    const result = await bridge.listObjects(root);

    expect(result).toEqual(['Apple.txt', 'ace.txt', 'docs']);
  });

  test('FSBridge.objectExists: true', async () => {
    const bridge = new FSBridge();
    const filePath = path.resolve(root, 'Apple.txt');
    const result = await bridge.objectExists(filePath);

    expect(fs.existsSync(filePath)).toEqual(true);
    expect(result).toEqual(true);
  });

  test('FSBridge.objectExists: false', async () => {
    const bridge = new FSBridge();
    const filePath = path.resolve(root, 'does-not-exist.txt');
    const result = await bridge.objectExists(filePath);

    expect(fs.existsSync(filePath)).toEqual(false);
    expect(result).toEqual(false);
  });

  test('FSBridge.objectStats: file', async () => {
    const bridge = new FSBridge();
    const result = await bridge.objectStats(path.resolve(root, 'ace.txt'));

    expect(result.isDirectory()).toBe(false);
    expect(result.size).toBeDefined();
    expect(result.mtime).toBeDefined();
  });

  test('FSBridge.objectStats: directory', async () => {
    const bridge = new FSBridge();
    const result = await bridge.objectStats(path.resolve(root, 'docs'));

    expect(result.isDirectory()).toBe(true);
    expect(result.size).toBeDefined();
    expect(result.mtime).toBeDefined();
  });

  test('FSBridge.putObject', async () => {
    const bridge = new FSBridge();
    const filePath = path.resolve(tmp, 'A.txt');
    const content = 'The quick brown fox jumped over the lazy dog.';

    expect(fs.existsSync(filePath)).toBe(false);

    await bridge.putObject({
      filePath,
      body: Readable.from([content])
    });

    expect(fs.existsSync(filePath)).toBe(true);
    expect(await readFile(filePath, 'utf8')).toBe(content);
  });

  test('FSBridge.putObject: prefix', async () => {
    const bridge = new FSBridge();
    const filePath = path.resolve(tmp, 'foo', 'bar', 'A.txt');
    const content = 'The quick brown fox jumped over the lazy dog.';

    expect(fs.existsSync(filePath)).toBe(false);

    await bridge.putObject({
      filePath,
      body: Readable.from([content])
    });

    expect(fs.existsSync(filePath)).toBe(true);
    expect(await readFile(filePath, 'utf8')).toBe(content);
  });

  test('FSBridge.putObject: missing body', async () => {
    const bridge = new FSBridge();
    const filePath = path.resolve(tmp, 'A.txt');

    try {
      await bridge.putObject({ filePath });
      throw new Error('Did not throw');
    } catch (error) {
      expect(error.message).toMatch(/Missing body/);
    }
  });

  test('FSBridge.copyObject', async () => {
    const bridge = new FSBridge();
    const fromPath = path.resolve(root, 'ace.txt');
    const toPath = path.resolve(tmp, 'ace.txt');

    expect(fs.existsSync(toPath)).toBe(false);

    await bridge.copyObject({ fromPath, toPath });

    expect(fs.existsSync(toPath)).toBe(true);
    expect(await readFile(toPath, 'utf8')).toBe(aceContent);
  });

  test('FSBridge.copyObject: prefix', async () => {
    const bridge = new FSBridge();
    const fromPath = path.resolve(root, 'ace.txt');
    const toPath = path.resolve(tmp, 'foo', 'bar', 'ace.txt');

    expect(fs.existsSync(toPath)).toBe(false);

    await bridge.copyObject({ fromPath, toPath });

    expect(fs.existsSync(toPath)).toBe(true);
    expect(await readFile(toPath, 'utf8')).toBe(aceContent);
  });

  test('FSBridge.copyObject: flags', async () => {
    const bridge = new FSBridge();
    const fromPath = path.resolve(root, 'ace.txt');
    const toPath = path.resolve(tmp, 'ace.txt');

    expect(fs.existsSync(toPath)).toBe(false);

    await bridge.copyObject({ fromPath, toPath, flags: 0 });

    expect(fs.existsSync(toPath)).toBe(true);
    expect(await readFile(toPath, 'utf8')).toBe(aceContent);
  });

  test('FSBridge.deleteObject', async () => {
    const bridge = new FSBridge();
    const filePath = path.resolve(tmp, 'del-me.txt');

    await writeFile(filePath, '--TO DELETE--', 'utf8');

    expect(fs.existsSync(filePath)).toBe(true);

    await bridge.deleteObject({ filePath });

    expect(fs.existsSync(filePath)).toBe(false);
  });

  test('FSBridge.deleteObject: non-existent', async () => {
    const bridge = new FSBridge();
    const filePath = path.resolve(tmp, 'del-me.txt');

    expect(fs.existsSync(filePath)).toBe(false);

    await bridge.deleteObject({ filePath });

    expect(fs.existsSync(filePath)).toBe(false);
  });

  test('FSBridge.getObjectReadStream', async () => {
    const bridge = new FSBridge();
    const filePath = path.resolve(root, 'ace.txt');

    expect(fs.existsSync(filePath)).toBe(true);
    expect(await readFile(filePath, 'utf8')).toBe(aceContent);

    const result = bridge.getObjectReadStream({ filePath });

    expect(await streamToString(result)).toBe(aceContent);
  });

  test('FSBridge.getMD5FromReadStream', async () => {
    const bridge = new FSBridge();

    const result = await bridge.getMD5FromReadStream(Readable.from(['foo']));

    expect(result).toBe(fooMd5);
  });

  // END describe
});
