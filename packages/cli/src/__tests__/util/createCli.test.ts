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

const mockExitCallback: ExitCallback = (() => {}) as unknown as ExitCallback;

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

  test('createCli: no command', async () => {
    const mockStdout = mockProcessStdout();

    await createCli({
      templatePath,
      configLoader
    });

    expect(mockStdout).toHaveBeenCalledWith(`${helpText}${helpFooter}\n`);

    mockStdout.mockRestore();
  });

  test('createCli: help', async () => {
    const mockStdout = mockProcessStdout();
    const [node, script] = process.argv;
    process.argv = [node, script, 'help'];

    await createCli({
      templatePath,
      configLoader
    });

    expect(mockStdout).toHaveBeenCalledWith(`${helpText}${helpFooter}\n`);

    mockStdout.mockRestore();
  });

  test('createCli: init --cwd', async () => {
    const mockStdout = mockProcessStdout();
    const [node, script] = process.argv;
    process.argv = [node, script, 'init', '--cwd', tmp];

    await createCli({
      templatePath,
      configLoader
    });

    expect(mockStdout).toHaveBeenCalled();

    mockStdout.mockRestore();
  });

  test('createCli: version --json', async () => {
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
  });

  test('createCli: demo.ls', async () => {
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
  });

  test('createCli: demo.sync -y', async () => {
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
  });

  test('createCli: demo.sync -cy', async () => {
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
  });

  test('createCli: demo.sync -n', async () => {
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
  });

  test('createCli: ls --cwd -i', async () => {
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
  });

  test('createCli: ls additional roots', async () => {
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
  });

  test('createCli: ls non-existent root', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(mockExitCallback);
    const mockStdout = mockProcessStdout();
    const [node, script] = process.argv;
    const root = path.resolve(fix, 'root-a');
    process.argv = [node, script, 'ls', '-o', path.resolve(root, 'dne')];

    await createCli({ templatePath, configLoader });

    expect(mockExit).toHaveBeenCalledWith(1);

    mockStdout.mockRestore();
  });

  test('createCli: sync no delegate', async () => {
    const mockStdout = mockProcessStdout();
    const onLog = jest.fn();
    const [node, script] = process.argv;
    const proj = path.resolve(fix, 'cwd-a');
    process.argv = [node, script, 'sync', '-nC', proj];

    await createCli({
      templatePath,
      configLoader: (filePath) => ({
        ...configLoader(filePath),
        onLog
      })
    });

    expect(onLog).toHaveBeenCalled();

    mockStdout.mockRestore();
  });

  test('createCli: sync delegate.createPlanner', async () => {
    const plan = jest.fn();
    const planner = { plan };
    const mockStdout = mockProcessStdout();
    const [node, script] = process.argv;
    const proj = path.resolve(fix, 'cwd-a');
    process.argv = [node, script, 'sync', '-nC', proj];

    await createCli({
      templatePath,
      configLoader: (filePath) => ({
        ...configLoader(filePath),
        delegate: {
          createPlanner: () => planner
        }
      })
    });

    expect(plan).toHaveBeenCalledTimes(1);

    mockStdout.mockRestore();
  });

  test('createCli: delegate.createLogger', async () => {
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
  });

  test('createCli: MUTE=1', async () => {
    const mockStdout = mockProcessStdout();
    const [node, script] = process.argv;
    const root = path.resolve(fix, 'root-a');
    process.argv = [node, script, 'ls', '-o', root];
    process.env['MUTE'] = '1';

    await createCli({ templatePath, configLoader });

    expect(mockStdout).toHaveBeenCalledTimes(0);

    mockStdout.mockRestore();
  });

  test('createCli: parseArgs', async () => {
    const mockStdout = mockProcessStdout();
    const root = path.resolve(fix, 'root-a');
    const parseArgs = () => ({ _: ['ls'], origin: root });

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
      }),
      parseArgs
    });

    expect(onLog).toHaveBeenCalledTimes(2); // begin/end for each provider

    mockStdout.mockRestore();
  });

  test('createCli: handleError', async () => {
    const mockStdout = mockProcessStdout();
    const handleError = jest.fn();
    const [node, script] = process.argv;
    const root = path.resolve(fix, 'root-a');
    process.argv = [node, script, 'ls', '-o', path.resolve(root, 'dne')];

    await createCli({ templatePath, configLoader, handleError });

    expect(handleError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching('not found')
      })
    );

    mockStdout.mockRestore();
  });

  // END describe
});
