// TODO: Tests for calculateETag, limitRequests options? (covered by listFiles tests)

import { mockProcessStdout, mockProcessStderr } from 'jest-mock-process';
import { File } from '@s3-publish/core';
import { MockProvider } from '@s3-publish/core/lib/__mock__/MockProvider';
import { A, B, C } from '../__fixtures__/files';
import ls from '../../commands/ls';

test('ls: empty', async (done) => {
  const log = jest.fn();
  const logger = { log };

  try {
    await ls({ logger, providers: [] });
    throw new Error('Did not throw');
  } catch (error) {
    expect(error.message).toMatch(/Nothing to do/);
    expect(log).toHaveBeenCalledTimes(0);
  }

  done();
});

test('ls: mock', async (done) => {
  let i = 1;
  const log = jest.fn((msg) => {
    switch (i) {
      case 2:
        expect(msg.type).toBe('ls:result');
        expect(msg.provider).toBe(providers[0]);
        expect(msg.files).toEqual(providers[0].files);
        expect(msg.ignored).toEqual([]);
        expect(msg.ignoredCount).toBe(0);
        expect(msg.duration).toBeDefined();
        break;

      case 4:
        expect(msg.type).toBe('ls:result');
        expect(msg.provider).toBe(providers[1]);
        expect(msg.files).toEqual(providers[1].files);
        expect(msg.ignored).toEqual([]);
        expect(msg.ignoredCount).toBe(0);
        expect(msg.duration).toBeDefined();
        break;
    }

    i++;
  });
  const logger = { log };
  const providers = [
    new MockProvider({
      root: './public',
      files: [A, B, C],
      sleepMs: 20
    }),
    new MockProvider({
      root: 's3://s3p-test',
      files: [A, B, C]
    })
  ];

  await ls({ logger, providers });

  expect(log).toHaveBeenCalledTimes(4);
  expect(log).toHaveBeenNthCalledWith(1, {
    type: 'ls:begin',
    provider: providers[0]
  });
  expect(log).toHaveBeenNthCalledWith(3, {
    type: 'ls:begin',
    provider: providers[1]
  });

  done();
});

test('ls: mock (no logger)', async (done) => {
  const mockStdout = mockProcessStdout();
  const mockStderr = mockProcessStderr();
  const providers = [
    new MockProvider({
      root: './public',
      files: [A, B, C]
    }),
    new MockProvider({
      root: 's3://s3p-test',
      files: [A, B, C]
    })
  ];

  await ls({ providers });

  expect(mockStdout).toHaveBeenCalledTimes(0);
  expect(mockStderr).toHaveBeenCalledTimes(0);

  mockStdout.mockRestore();
  mockStderr.mockRestore();

  done();
});

test('ls: mock (ignore)', async (done) => {
  let i = 1;
  const log = jest.fn((msg) => {
    switch (i) {
      case 2:
        expect(msg.type).toBe('ls:result');
        expect(msg.provider).toBe(providers[0]);
        expect(msg.files).toEqual(
          new Map<string, File>([
            [A.Key, providers[0].files.get(A.Key) as File],
            [C.Key, providers[0].files.get(C.Key) as File]
          ])
        );
        expect(msg.ignored).toEqual([]);
        expect(msg.ignoredCount).toBe(1);
        expect(msg.duration).toBeDefined();
        break;

      case 4:
        expect(msg.type).toBe('ls:result');
        expect(msg.provider).toBe(providers[1]);
        expect(msg.files).toEqual(providers[1].files);
        expect(msg.ignored).toEqual([]);
        expect(msg.ignoredCount).toBe(0);
        expect(msg.duration).toBeDefined();
        break;
    }

    i++;
  });
  const logger = { log };
  const providers = [
    new MockProvider({
      root: './public',
      files: [A, B, C],
      ignores: (file) => file.Key === B.Key,
      sleepMs: 20
    }),
    new MockProvider({
      root: 's3://s3p-test',
      files: [A, B, C]
    })
  ];

  await ls({ logger, providers });

  expect(log).toHaveBeenCalledTimes(4);
  expect(log).toHaveBeenNthCalledWith(1, {
    type: 'ls:begin',
    provider: providers[0]
  });
  expect(log).toHaveBeenNthCalledWith(3, {
    type: 'ls:begin',
    provider: providers[1]
  });

  done();
});

test('ls: mock (ignore + trackIgnored)', async (done) => {
  let i = 1;
  const log = jest.fn((msg) => {
    switch (i) {
      case 2:
        expect(msg.type).toBe('ls:result');
        expect(msg.provider).toBe(providers[0]);
        expect(msg.files).toEqual(
          new Map<string, File>([[A.Key, providers[0].files.get(A.Key) as File]])
        );
        expect(msg.ignored).toEqual([
          {
            type: 'ignore',
            file: providers[0].files.get(B.Key) as File
          },
          {
            type: 'ignore',
            file: providers[0].files.get(C.Key) as File
          }
        ]);
        expect(msg.ignoredCount).toBe(2);
        expect(msg.duration).toBeDefined();
        break;

      case 4:
        expect(msg.type).toBe('ls:result');
        expect(msg.provider).toBe(providers[1]);
        expect(msg.files).toEqual(
          new Map<string, File>([
            [B.Key, providers[1].files.get(B.Key) as File],
            [C.Key, providers[1].files.get(C.Key) as File]
          ])
        );
        expect(msg.ignored).toEqual([
          {
            type: 'ignore',
            file: providers[1].files.get(A.Key) as File
          }
        ]);
        expect(msg.ignoredCount).toBe(1);
        expect(msg.duration).toBeDefined();
        break;
    }

    i++;
  });
  const logger = { log };
  const providers = [
    new MockProvider({
      root: './public',
      files: [A, B, C],
      ignores: (file) => file.Key !== A.Key,
      sleepMs: 20
    }),
    new MockProvider({
      root: 's3://s3p-test',
      ignores: (file) => file.Key === A.Key,
      files: [A, B, C]
    })
  ];

  await ls({ logger, providers, trackIgnored: true });

  expect(log).toHaveBeenCalledTimes(4);
  expect(log).toHaveBeenNthCalledWith(1, {
    type: 'ls:begin',
    provider: providers[0]
  });
  expect(log).toHaveBeenNthCalledWith(3, {
    type: 'ls:begin',
    provider: providers[1]
  });

  done();
});
