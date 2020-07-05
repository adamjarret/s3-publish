import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import { mockProcessStdout } from 'jest-mock-process';
// import { MockS3Bridge } from '@s3-publish/provider-s3/lib/__mock__/MockS3Bridge';
import { helpText, helpFooter } from '../../commands/help';
import { createCli } from '../../util/createCli';
import { createConfigLoader } from '../../util/createConfigLoader';
import { packageVersions } from '../../constants/packageVersions';

const tmp = path.resolve(__dirname, '..', '__tmp__', 'createCli');
const fix = path.resolve(__dirname, '..', '__fixtures__');
const templatePath = path.resolve(__dirname, '..', '..', '..', 'config');
const configLoader = createConfigLoader(require);

type ExitCallback = (code?: number) => never;

const mockExitCallback: ExitCallback = ((() => {}) as unknown) as ExitCallback;

describe('createCli', () => {
  const OLD_ENV = process.env;
  const OLD_ARGV = process.argv;
  const cwd = process.cwd();

  beforeEach(() => {
    jest.resetModules(); // this is important - it clears the cache
    process.env = { ...OLD_ENV };
    process.argv = [...OLD_ARGV];
    process.chdir(cwd);
    rimraf.sync(tmp);
    fs.mkdirSync(tmp);
  });

  afterEach(() => {
    process.env = OLD_ENV;
    process.argv = OLD_ARGV;
    rimraf.sync(tmp);
  });

  test('createCli: no command', async (done) => {
    const mockStdout = mockProcessStdout();

    await createCli({
      templatePath,
      configLoader
    });

    expect(mockStdout).toHaveBeenCalledWith(`${helpText}${helpFooter}\n`);

    mockStdout.mockRestore();

    done();
  });

  test('createCli: help', async (done) => {
    const mockStdout = mockProcessStdout();
    const [node, script] = process.argv;
    process.argv = [node, script, 'help'];

    await createCli({
      templatePath,
      configLoader
    });

    expect(mockStdout).toHaveBeenCalledWith(`${helpText}${helpFooter}\n`);

    mockStdout.mockRestore();

    done();
  });

  test('createCli: init --cwd', async (done) => {
    const mockStdout = mockProcessStdout();
    const [node, script] = process.argv;
    process.argv = [node, script, 'init', '--cwd', tmp];

    await createCli({
      templatePath,
      configLoader
    });

    expect(mockStdout).toHaveBeenCalled();

    mockStdout.mockRestore();

    done();
  });

  test('createCli: version --json', async (done) => {
    const msg = { type: 'version', packageVersions };
    const mockStdout = mockProcessStdout();
    const onLog = jest.fn();
    const [node, script] = process.argv;
    process.argv = [node, script, 'version', '--json'];

    await createCli({
      templatePath,
      configLoader: (filePath) => ({
        ...configLoader(filePath),
        onLog
      })
    });

    expect(onLog).toHaveBeenCalledWith(msg);
    if (process.env.MUTE) {
      expect(mockStdout).toHaveBeenCalledTimes(0);
    } else {
      expect(mockStdout).toHaveBeenCalledWith(JSON.stringify(msg, undefined, 2) + '\n');
    }

    mockStdout.mockRestore();

    done();
  });

  test('createCli: demo.ls', async (done) => {
    const mockStdout = mockProcessStdout();
    const onLog = jest.fn();
    const [node, script] = process.argv;
    process.argv = [
      node,
      script,
      'ls',
      '--config',
      path.resolve(templatePath, 's3p.demo.js')
    ];

    await createCli({
      templatePath,
      configLoader: (filePath) => ({
        ...configLoader(filePath),
        onLog
      })
    });

    expect(onLog).toHaveBeenCalledTimes(4); // begin/end for each provider

    mockStdout.mockRestore();

    done();
  });

  test('createCli: demo.sync -y', async (done) => {
    const mockStdout = mockProcessStdout();
    const onLog = jest.fn();
    const [node, script] = process.argv;
    process.argv = [
      node,
      script,
      'sync',
      '-y',
      '--config',
      path.resolve(templatePath, 's3p.demo.js')
    ];

    await createCli({
      templatePath,
      configLoader: (filePath) => ({
        ...configLoader(filePath),
        onLog
      })
    });

    expect(onLog).toHaveBeenCalledTimes(9); // sync:plan:begin, sync:plan:result, sync:operation:begin x3, sync:operation:result x3, sync:result

    mockStdout.mockRestore();

    done();
  });

  test('createCli: demo.sync -cy', async (done) => {
    const mockStdout = mockProcessStdout();
    const onLog = jest.fn();
    const [node, script] = process.argv;
    process.argv = [
      node,
      script,
      'sync',
      '-cy',
      '--config',
      path.resolve(templatePath, 's3p.demo.js')
    ];

    await createCli({
      templatePath,
      configLoader: (filePath) => ({
        ...configLoader(filePath),
        onLog
      })
    });

    expect(onLog).toHaveBeenCalledTimes(9); // sync:plan:begin, sync:plan:result, sync:operation:begin x3, sync:operation:result x3, sync:result

    mockStdout.mockRestore();

    done();
  });

  test('createCli: demo.sync -n', async (done) => {
    const mockStdout = mockProcessStdout();
    const onLog = jest.fn();
    const [node, script] = process.argv;
    process.argv = [
      node,
      script,
      'sync',
      '-n',
      '--config',
      path.resolve(templatePath, 's3p.demo.js')
    ];

    await createCli({
      templatePath,
      configLoader: (filePath) => ({
        ...configLoader(filePath),
        onLog
      })
    });

    expect(onLog).toHaveBeenCalledTimes(2); // sync:plan:begin, sync:plan:result

    mockStdout.mockRestore();

    done();
  });

  test('createCli: ls --cwd -i', async (done) => {
    const mockStdout = mockProcessStdout();
    const [node, script] = process.argv;
    const root = path.resolve(fix, 'root-a');
    process.argv = [node, script, 'ls', '--cwd', root, '-i', '*.txt'];

    let i = 0;
    const onLog = jest.fn((message) => {
      switch (i) {
        case 0:
          expect(message).toMatchObject({ type: 'ls:begin' });
          break;
        case 1:
          expect(message).toMatchObject({ type: 'ls:result', ignoredCount: 2 });
          expect(message.files.size).toBe(5);
          break;
      }
      i++;
    });

    await createCli({
      templatePath,
      configLoader: (filePath) => ({
        ...configLoader(filePath),
        onLog
      })
    });

    expect(onLog).toHaveBeenCalledTimes(2); // begin/end for each provider

    mockStdout.mockRestore();

    done();
  });

  test('createCli: ls additional roots', async (done) => {
    const mockStdout = mockProcessStdout();
    const [node, script] = process.argv;
    const root = path.resolve(fix, 'root-a');
    process.argv = [node, script, 'ls', '--no-origin', root];

    let i = 0;
    const onLog = jest.fn((message) => {
      switch (i) {
        case 0:
          expect(message).toMatchObject({ type: 'ls:begin' });
          break;
        case 1:
          expect(message).toMatchObject({ type: 'ls:result', ignoredCount: 0 });
          expect(message.files.size).toBe(7);
          break;
      }
      i++;
    });

    await createCli({
      templatePath,
      configLoader: (filePath) => ({
        ...configLoader(filePath),
        onLog
      })
    });

    expect(onLog).toHaveBeenCalledTimes(2); // begin/end for each provider

    mockStdout.mockRestore();

    done();
  });

  test('createCli: ls non-existent root', async (done) => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(mockExitCallback);
    const mockStdout = mockProcessStdout();
    const [node, script] = process.argv;
    const root = path.resolve(fix, 'root-a');
    process.argv = [node, script, 'ls', '-o', path.resolve(root, 'dne')];

    await createCli({ templatePath, configLoader });

    expect(mockExit).toHaveBeenCalledWith(1);

    mockStdout.mockRestore();

    done();
  });

  test('createCli: delegate.createLogger', async (done) => {
    const log = jest.fn();
    const logger = { log };
    const mockStdout = mockProcessStdout();
    const [node, script] = process.argv;
    const root = path.resolve(fix, 'root-a');
    process.argv = [node, script, 'ls', '-o', root];

    await createCli({
      templatePath,
      configLoader: (filePath) => ({
        ...configLoader(filePath),
        delegate: {
          createLogger: () => logger
        }
      })
    });

    expect(log).toHaveBeenCalledTimes(2);

    mockStdout.mockRestore();

    done();
  });

  test('createCli: MUTE=1', async (done) => {
    const mockStdout = mockProcessStdout();
    const [node, script] = process.argv;
    const root = path.resolve(fix, 'root-a');
    process.argv = [node, script, 'ls', '-o', root];
    process.env['MUTE'] = '1';

    await createCli({ templatePath, configLoader });

    expect(mockStdout).toHaveBeenCalledTimes(0);

    mockStdout.mockRestore();

    done();
  });

  // END describe
});
