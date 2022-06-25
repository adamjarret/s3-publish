import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import { FileWithoutProvider, SyncPlanner } from '@s3-publish/core';
import { MockProvider } from '@s3-publish/core/lib/__mock__/MockProvider';
import { mockProcessStdout } from 'jest-mock-process';
import mockStdin from 'mock-stdin';
import sync from '../../commands/sync';
import { A, B, C } from '../__fixtures__/files';

const tmp = path.resolve(__dirname, '..', '__tmp__', 'sync');

describe('sync', () => {
  beforeEach(() => {
    jest.resetModules(); // this is important - it clears the cache
    rimraf.sync(tmp);
    fs.mkdirSync(tmp);
  });

  afterEach(() => {
    rimraf.sync(tmp);
  });

  test('sync: no logger', async () => {
    const mockStdout = mockProcessStdout();
    const origin = new MockProvider({ root: './public', files: [A, B, C] });
    const target = new MockProvider({ root: 's3://s3p-test', files: [A, B] });
    const planner = new SyncPlanner({ origin, target });

    await sync({ planner, proceed: true });

    expect(mockStdout).toHaveBeenCalledTimes(0);

    mockStdout.mockRestore();
  });

  test('sync: nothing to do', async () => {
    const log = jest.fn();
    const logger = { log };
    const files: FileWithoutProvider[] = [];
    const origin = new MockProvider({ root: './public', files });
    const target = new MockProvider({ root: 's3://s3p-test', files });
    const planner = new SyncPlanner({ origin, target });

    await sync({ logger, planner });

    expect(log).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenNthCalledWith(1, {
      type: 'sync:plan:begin'
    });
    expect(log).toHaveBeenNthCalledWith(2, {
      type: 'sync:plan:result',
      ignored: {},
      ignoredCount: 0,
      operations: [],
      skipped: [],
      skippedCount: 0
    });
  });

  test('sync: confirm', async () => {
    const mockStdout = mockProcessStdout();
    const stdin = mockStdin.stdin();
    const log = jest.fn();
    const logger = { log };
    const origin = new MockProvider({
      root: './public',
      files: [A]
    });
    const target = new MockProvider({
      root: 's3://s3p-test',
      files: []
    });
    const planner = new SyncPlanner({ origin, target });

    process.nextTick(() => {
      stdin.send('Y\n');
    });

    await sync({ logger, planner });

    expect(log).toHaveBeenCalledTimes(5);
    expect(log).toHaveBeenNthCalledWith(1, {
      type: 'sync:plan:begin'
    });
    expect(log).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'sync:plan:result',
        ignored: {},
        ignoredCount: 0,
        skipped: [],
        skippedCount: 0
      })
    );
    expect(log).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        type: 'sync:operation:begin'
      })
    );
    expect(log).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        type: 'sync:operation:result'
      })
    );
    expect(log).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        type: 'sync:result'
      })
    );

    stdin.restore();
    mockStdout.mockRestore();
  });

  test('sync: cancel', async () => {
    const mockStdout = mockProcessStdout();
    const stdin = mockStdin.stdin();
    const log = jest.fn();
    const logger = { log };
    const origin = new MockProvider({
      root: './public',
      files: [A]
    });
    const target = new MockProvider({
      root: 's3://s3p-test',
      files: []
    });
    const planner = new SyncPlanner({ origin, target });

    process.nextTick(() => {
      stdin.send('n\n');
    });

    await sync({ logger, planner });

    expect(log).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenNthCalledWith(1, {
      type: 'sync:plan:begin'
    });
    expect(log).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'sync:plan:result',
        ignored: {},
        ignoredCount: 0,
        skipped: [],
        skippedCount: 0
      })
    );

    stdin.restore();
    mockStdout.mockRestore();
  });

  test('sync: proceed=false', async () => {
    const mockStdout = mockProcessStdout();
    const log = jest.fn();
    const logger = { log };
    const origin = new MockProvider({
      root: './public',
      files: [A]
    });
    const target = new MockProvider({
      root: 's3://s3p-test',
      files: []
    });
    const planner = new SyncPlanner({ origin, target });

    await sync({ logger, planner, proceed: false });

    expect(log).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenNthCalledWith(1, {
      type: 'sync:plan:begin'
    });
    expect(log).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'sync:plan:result',
        ignored: {},
        ignoredCount: 0,
        skipped: [],
        skippedCount: 0
      })
    );

    mockStdout.mockRestore();
  });

  test('sync: ignore', async () => {
    const log = jest.fn();
    const logger = { log };
    const origin = new MockProvider({
      root: './public',
      files: [A, B, C],
      ignores: (file) => file.Key !== A.Key
    });
    const target = new MockProvider({
      root: 's3://s3p-test',
      files: []
    });
    const planner = new SyncPlanner({ origin, target });

    await sync({ logger, planner, proceed: true });

    expect(log).toHaveBeenCalledTimes(5);
    expect(log).toHaveBeenNthCalledWith(1, {
      type: 'sync:plan:begin'
    });
    expect(log).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'sync:plan:result',
        ignored: {}, // empty because trackIgnored is not set
        ignoredCount: 2,
        skipped: [],
        skippedCount: 0
      })
    );
    expect(log).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        type: 'sync:operation:begin'
      })
    );
    expect(log).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        type: 'sync:operation:result'
      })
    );
    expect(log).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        type: 'sync:result'
      })
    );
  });

  test('sync: ignore + trackIgnored', async () => {
    const log = jest.fn();
    const logger = { log };
    const origin = new MockProvider({
      root: './public',
      files: [A, B, C],
      ignores: (file) => file.Key !== A.Key
    });
    const target = new MockProvider({
      root: 's3://s3p-test',
      files: []
    });
    const planner = new SyncPlanner({ origin, target });

    await sync({ logger, planner, proceed: true, trackIgnored: true });

    expect(log).toHaveBeenCalledTimes(5);
    expect(log).toHaveBeenNthCalledWith(1, {
      type: 'sync:plan:begin'
    });
    expect(log).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'sync:plan:result',
        ignored: {
          [origin.root]: [
            {
              type: 'ignore',
              file: {
                SourceProvider: origin,
                ...B
              }
            },
            {
              type: 'ignore',
              file: {
                SourceProvider: origin,
                ...C
              }
            }
          ]
        },
        ignoredCount: 2,
        skipped: [],
        skippedCount: 0
      })
    );
    expect(log).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        type: 'sync:operation:begin'
      })
    );
    expect(log).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        type: 'sync:operation:result'
      })
    );
    expect(log).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        type: 'sync:result'
      })
    );
  });

  test('sync: skip', async () => {
    const log = jest.fn();
    const logger = { log };
    const origin = new MockProvider({
      root: './public',
      files: [A, B, C]
    });
    const target = new MockProvider({
      root: 's3://s3p-test',
      files: [A, B]
    });
    const planner = new SyncPlanner({ origin, target });

    await sync({ logger, planner, proceed: true });

    expect(log).toHaveBeenCalledTimes(5);
    expect(log).toHaveBeenNthCalledWith(1, {
      type: 'sync:plan:begin'
    });
    expect(log).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'sync:plan:result',
        ignored: {},
        ignoredCount: 0,
        skipped: [], // empty because trackSkipped is not set
        skippedCount: 2
      })
    );
    expect(log).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        type: 'sync:operation:begin'
      })
    );
    expect(log).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        type: 'sync:operation:result'
      })
    );
    expect(log).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        type: 'sync:result'
      })
    );
  });

  test('sync: skip + trackSkipped', async () => {
    let i = 1;
    const log = jest.fn((message) => {
      switch (i) {
        case 2:
          expect(message).toMatchObject({
            type: 'sync:plan:result',
            ignored: {},
            ignoredCount: 0,
            skippedCount: 3
          });
          expect(message.skipped[0]).toMatchObject({
            type: 'skip',
            file: {
              SourceProvider: origin,
              ...A
            },
            targetFile: {
              SourceProvider: target,
              ...A
            }
          });
          expect(message.skipped[1]).toMatchObject({
            type: 'skip',
            file: {
              SourceProvider: origin,
              ...B
            },
            targetFile: {
              SourceProvider: target,
              ...B
            }
          });
          expect(message.skipped[2]).toMatchObject({
            type: 'skip',
            file: {
              SourceProvider: origin,
              ...C
            },
            targetFile: {
              SourceProvider: target,
              ...C
            }
          });
          break;
      }
      i++;
    });
    const logger = { log };
    const origin = new MockProvider({
      root: './public',
      files: [A, B, C]
    });
    const target = new MockProvider({
      root: 's3://s3p-test',
      files: [A, B, C]
    });
    const planner = new SyncPlanner({ origin, target });

    await sync({ logger, planner, proceed: true, trackSkipped: true });

    expect(log).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenNthCalledWith(1, {
      type: 'sync:plan:begin'
    });
  });

  // END describe
});
