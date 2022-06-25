import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import rimraf from 'rimraf';
import { mockProcessStdout, mockProcessStderr } from 'jest-mock-process';
import init from '../../commands/init';

const readFile = promisify(fs.readFile);

const templatePath = path.resolve(__dirname, '..', '..', '..', 'config');
const srcPath = path.resolve(templatePath, `s3p.config.js`);
const src = fs.readFileSync(srcPath, 'utf8');

describe('init', () => {
  const cwd = process.cwd();
  const tmp = path.resolve(__dirname, '..', '__tmp__', 'init');

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

  test('init: comprehensive', async () => {
    const log = jest.fn();
    const logForce = jest.fn();
    const logger = { log };
    const loggerForce = { log: logForce };
    const wrote = path.resolve(process.cwd(), '.s3p.config.js');

    expect(fs.existsSync(wrote)).toBe(false);

    await init({ logger, templatePath });

    expect(fs.existsSync(wrote)).toBe(true);
    expect(await readFile(wrote, 'utf8')).toBe(src);
    expect(log).toHaveBeenCalledWith({
      type: 'init:result',
      wrote
    });

    // Refuse to overwrite file by default
    try {
      await init({ logger, templatePath });
      throw new Error('Did not throw');
    } catch (error) {
      expect(error.message).toMatch(/Use --force to overwrite/);
    }

    // Overwrite file if force is true
    await init({ logger: loggerForce, templatePath, force: true });

    expect(logForce).toHaveBeenCalledWith({
      type: 'init:result',
      wrote
    });
  });

  test('init: no logger', async () => {
    const mockStdout = mockProcessStdout();
    const mockStderr = mockProcessStderr();

    await init({ templatePath });

    expect(mockStdout).toHaveBeenCalledTimes(0);
    expect(mockStderr).toHaveBeenCalledTimes(0);

    mockStdout.mockRestore();
    mockStderr.mockRestore();
  });

  test('init: writePath (alt)', async () => {
    const log = jest.fn();
    const logger = { log };
    const writePath = '.s3p.config.settings.js';
    const wrote = path.resolve(process.cwd(), writePath);

    expect(fs.existsSync(wrote)).toBe(false);

    await init({ logger, templatePath, writePath });

    expect(fs.existsSync(wrote)).toBe(true);
    expect(await readFile(wrote, 'utf8')).toBe(src);
    expect(log).toHaveBeenCalledWith({
      type: 'init:result',
      wrote
    });
  });

  test('init: writePath (non-existent)', async () => {
    const log = jest.fn();
    const logger = { log };

    try {
      await init({ writePath: 'foo/bar.js', logger, templatePath });
      throw new Error('Did not throw');
    } catch (error) {
      expect(error.message).toMatch(/ENOENT/);
    }

    expect(log).toHaveBeenCalledTimes(0);
  });

  test('init: writePath (false)', (done) => {
    process.stdout.once('pipe', (input) => {
      const chunks: string[] = [];
      const handleChunk = (chunk: string) => chunks.push(chunk);

      input.on('data', handleChunk);
      input.once('end', () => {
        expect(chunks.join('')).toBe(src);
        input.off('data', handleChunk);
        done();
      });

      // Prevent init output from cluttering up the test output
      input.unpipe(process.stdout);
    });

    // DO NOT await init here, test will hang
    init({ writePath: false, templatePath });
  });

  // END describe
});
