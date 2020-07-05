import { PassThrough } from 'stream';
import { mockProcessStdout } from 'jest-mock-process';
import { JsonLogger } from '../../JsonLogger';
import {
  error,
  initResult,
  lsBegin,
  lsResult,
  syncPlanBegin,
  syncPlanResult,
  syncOperationBegin,
  syncOperationResult,
  version
} from '../__constants__/MessageTypes';
import {
  LoggerOptions,
  LogMessage,
  MessageError,
  MessageInitResult,
  MessageLsBegin,
  MessageLsResult,
  MessageSyncOperationBegin,
  MessageSyncOperationResult,
  MessageSyncPlanBegin,
  MessageSyncPlanResult,
  MessageVersion
} from '../../types';
import {
  A,
  B,
  renderedFiles,
  renderedFilesWithETag,
  params
} from '../__fixtures__/files';

type Replacer = (this: unknown, key: string, value: unknown) => unknown;

class ErrorWithCode extends Error {
  public code?: number;
}

function stringify(obj: unknown, replacer?: Replacer): string {
  return JSON.stringify(obj, replacer, 2);
}

async function loggerOutput(
  options: LoggerOptions,
  messages: LogMessage[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const stream = new PassThrough();
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => {
      stream.destroy();
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    const logger = new JsonLogger({ ...options, stream });
    messages.forEach((m) => logger.log(m));
    stream.end();
  });
}

test('JsonLogger: initResult', (done) => {
  loggerOutput({}, [
    {
      type: initResult,
      wrote: '/path/to/.s3.config.js'
    }
  ])
    .then((output) => {
      expect(output).toBe(
        stringify({
          type: initResult,
          wrote: '/path/to/.s3.config.js'
        }) + '\n'
      );
      done();
    })
    .catch(done);
});

test('JsonLogger: initResult (wrote: undefined)', (done) => {
  loggerOutput({}, [
    {
      type: initResult
    }
  ])
    .then((output) => {
      // If the message does not define a `wrote` property, it is not logged
      expect(output).toBe('');
      done();
    })
    .catch(done);
});

test('JsonLogger: onLog', (done) => {
  const onLog = jest.fn();
  loggerOutput({ onLog }, [
    {
      type: initResult,
      wrote: '/path/to/.s3.config.js'
    }
  ])
    .then((output) => {
      expect(onLog).toHaveBeenCalledTimes(1);
      expect(output).toBe(
        stringify({
          type: initResult,
          wrote: '/path/to/.s3.config.js'
        }) + '\n'
      );
      done();
    })
    .catch(done);
});

test('JsonLogger: stream (default)', () => {
  const mockStdout = mockProcessStdout();
  const logger = new JsonLogger();
  logger.log({
    type: initResult,
    wrote: '/path/to/.s3.config.js'
  });
  expect(mockStdout).toHaveBeenCalledWith(
    stringify({
      type: initResult,
      wrote: '/path/to/.s3.config.js'
    }) + '\n'
  );
  mockStdout.mockRestore();
});

test('JsonLogger: stream (explicitly undefined)', () => {
  const mockStdout = mockProcessStdout();
  const logger = new JsonLogger({ stream: undefined });
  logger.log({
    type: initResult,
    wrote: '/path/to/.s3.config.js'
  });
  expect(mockStdout).toHaveBeenCalledTimes(1);
  mockStdout.mockRestore();
});

test('JsonLogger: stream (null)', () => {
  const mockStdout = mockProcessStdout();
  const logger = new JsonLogger({ stream: null });
  logger.log({
    type: initResult,
    wrote: '/path/to/.s3.config.js'
  });
  expect(mockStdout).toHaveBeenCalledTimes(0);
  mockStdout.mockRestore();
});

test('JsonLogger.replacer: initResult', () => {
  const value: MessageInitResult = {
    type: initResult,
    wrote: '/path/to/.s3.config.js'
  };
  const expected = stringify({
    type: initResult,
    wrote: '/path/to/.s3.config.js'
  });
  const logger = new JsonLogger();
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: lsBegin', () => {
  const value: MessageLsBegin = {
    type: lsBegin,
    provider: { root: './public' }
  };
  const expected = stringify({
    type: lsBegin,
    provider: { root: './public' }
  });
  const logger = new JsonLogger();
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: lsResult', () => {
  const value: MessageLsResult = {
    type: lsResult,
    provider: { root: './public' },
    files: new Map([
      [A.Key, A],
      [B.Key, B]
    ]),
    ignored: [],
    ignoredCount: 0,
    duration: 122
  };
  const expected = stringify({
    type: lsResult,
    provider: { root: './public' },
    files: [renderedFiles[A.Key], renderedFiles[B.Key]],
    ignoredCount: 0,
    duration: '122ms'
  });
  const logger = new JsonLogger();
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: lsResult with ignored', () => {
  const value: MessageLsResult = {
    type: lsResult,
    provider: { root: './public' },
    files: new Map([
      [A.Key, A],
      [B.Key, B]
    ]),
    ignored: [
      {
        type: 'ignore',
        file: A
      }
    ],
    ignoredCount: 1,
    duration: 122
  };
  const expected = stringify({
    type: lsResult,
    provider: { root: './public' },
    files: [renderedFiles[A.Key], renderedFiles[B.Key]],
    ignoredCount: 1,
    duration: '122ms'
  });
  const logger = new JsonLogger();
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: lsResult (showHashes)', () => {
  const value: MessageLsResult = {
    type: lsResult,
    provider: { root: './public' },
    files: new Map([
      [A.Key, A],
      [B.Key, B]
    ]),
    ignored: [],
    ignoredCount: 0,
    duration: 122
  };
  const expected = stringify({
    type: lsResult,
    provider: { root: './public' },
    files: [renderedFilesWithETag[A.Key], renderedFilesWithETag[B.Key]],
    ignoredCount: 0,
    duration: '122ms'
  });
  const logger = new JsonLogger({ showHashes: true });
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: lsResult (showIgnored)', () => {
  const value: MessageLsResult = {
    type: lsResult,
    provider: { root: './public' },
    files: new Map([
      [A.Key, A],
      [B.Key, B]
    ]),
    ignored: [
      {
        type: 'ignore',
        file: A
      }
    ],
    ignoredCount: 1,
    duration: 122
  };
  const expected = stringify({
    type: lsResult,
    provider: { root: './public' },
    files: [renderedFiles[A.Key], renderedFiles[B.Key]],
    ignored: [
      {
        file: renderedFiles[A.Key]
      }
    ],
    ignoredCount: 1,
    duration: '122ms'
  });
  const logger = new JsonLogger({ showIgnored: true });
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: lsResult (showHashes + showIgnored)', () => {
  const value: MessageLsResult = {
    type: lsResult,
    provider: { root: './public' },
    files: new Map([
      [A.Key, A],
      [B.Key, B]
    ]),
    ignored: [
      {
        type: 'ignore',
        file: A
      }
    ],
    ignoredCount: 1,
    duration: 122
  };
  const expected = stringify({
    type: lsResult,
    provider: { root: './public' },
    files: [renderedFilesWithETag[A.Key], renderedFilesWithETag[B.Key]],
    ignored: [
      {
        file: renderedFilesWithETag[A.Key]
      }
    ],
    ignoredCount: 1,
    duration: '122ms'
  });
  const logger = new JsonLogger({ showHashes: true, showIgnored: true });
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: syncPlanBegin', () => {
  const value: MessageSyncPlanBegin = {
    type: syncPlanBegin
  };
  const expected = stringify({
    type: syncPlanBegin
  });
  const logger = new JsonLogger();
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: syncPlanResult', () => {
  const value: MessageSyncPlanResult = {
    type: syncPlanResult,
    operations: [
      {
        type: 'PUT',
        reason: 'ADD',
        file: A,
        params: params[A.Key],
        job: () => Promise.resolve()
      },
      {
        type: 'PUT',
        reason: 'CHANGE',
        file: B,
        params: params[B.Key],
        job: () => Promise.resolve()
      }
    ],
    ignored: {},
    ignoredCount: 0,
    skipped: [],
    skippedCount: 0
  };
  const expected = stringify({
    type: syncPlanResult,
    operations: [
      {
        type: 'PUT',
        reason: 'ADD',
        file: renderedFiles[A.Key]
      },
      {
        type: 'PUT',
        reason: 'CHANGE',
        file: renderedFiles[B.Key]
      }
    ],
    ignoredCount: 0,
    skippedCount: 0
  });
  const logger = new JsonLogger();
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: syncPlanResult with ignored and skipped', () => {
  const value: MessageSyncPlanResult = {
    type: syncPlanResult,
    operations: [
      {
        type: 'PUT',
        reason: 'ADD',
        file: A,
        params: params[A.Key],
        job: () => Promise.resolve()
      },
      {
        type: 'PUT',
        reason: 'CHANGE',
        file: B,
        params: params[B.Key],
        job: () => Promise.resolve()
      }
    ],
    ignored: {
      [A.SourceProvider.root]: [
        {
          type: 'ignore',
          file: A
        }
      ]
    },
    ignoredCount: 1,
    skipped: [
      {
        type: 'skip',
        reason: 'CHANGE',
        file: A,
        targetFile: A
      }
    ],
    skippedCount: 1
  };
  const expected = stringify({
    type: syncPlanResult,
    operations: [
      {
        type: 'PUT',
        reason: 'ADD',
        file: renderedFiles[A.Key]
      },
      {
        type: 'PUT',
        reason: 'CHANGE',
        file: renderedFiles[B.Key]
      }
    ],
    ignoredCount: 1,
    skippedCount: 1
  });
  const logger = new JsonLogger();
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: syncPlanResult (showHashes)', () => {
  const value: MessageSyncPlanResult = {
    type: syncPlanResult,
    operations: [
      {
        type: 'PUT',
        reason: 'ADD',
        file: A,
        params: params[A.Key],
        job: () => Promise.resolve()
      },
      {
        type: 'PUT',
        reason: 'CHANGE',
        file: B,
        params: params[B.Key],
        job: () => Promise.resolve()
      }
    ],
    ignored: {},
    ignoredCount: 0,
    skipped: [],
    skippedCount: 0
  };
  const expected = stringify({
    type: syncPlanResult,
    operations: [
      {
        type: 'PUT',
        reason: 'ADD',
        file: renderedFilesWithETag[A.Key]
      },
      {
        type: 'PUT',
        reason: 'CHANGE',
        file: renderedFilesWithETag[B.Key]
      }
    ],
    ignoredCount: 0,
    skippedCount: 0
  });
  const logger = new JsonLogger({ showHashes: true });
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: syncPlanResult (showParams)', () => {
  const value: MessageSyncPlanResult = {
    type: syncPlanResult,
    operations: [
      {
        type: 'PUT',
        reason: 'ADD',
        file: A,
        params: params[A.Key],
        job: () => Promise.resolve()
      },
      {
        type: 'PUT',
        reason: 'CHANGE',
        file: B,
        params: params[B.Key],
        job: () => Promise.resolve()
      }
    ],
    ignored: {},
    ignoredCount: 0,
    skipped: [],
    skippedCount: 0
  };
  const expected = stringify({
    type: syncPlanResult,
    operations: [
      {
        type: 'PUT',
        reason: 'ADD',
        file: renderedFiles[A.Key],
        params: params[A.Key]
      },
      {
        type: 'PUT',
        reason: 'CHANGE',
        file: renderedFiles[B.Key],
        params: params[B.Key]
      }
    ],
    ignoredCount: 0,
    skippedCount: 0
  });
  const logger = new JsonLogger({ showParams: true });
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: syncPlanResult (showSkipped)', () => {
  const value: MessageSyncPlanResult = {
    type: syncPlanResult,
    operations: [],
    skipped: [
      {
        type: 'skip',
        reason: 'CHANGE',
        file: A,
        targetFile: A
      }
    ],
    skippedCount: 1,
    ignored: {},
    ignoredCount: 0
  };
  const expected = stringify({
    type: syncPlanResult,
    operations: [],
    skipped: [
      {
        reason: 'CHANGE',
        file: renderedFiles[A.Key],
        targetFile: renderedFiles[A.Key]
      }
    ],
    skippedCount: 1,
    ignoredCount: 0
  });
  const logger = new JsonLogger({ showSkipped: true });
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: syncPlanResult (showIgnored)', () => {
  const value: MessageSyncPlanResult = {
    type: syncPlanResult,
    operations: [],
    skipped: [],
    skippedCount: 0,
    ignored: {
      [A.SourceProvider.root]: [
        {
          type: 'ignore',
          file: A
        }
      ]
    },
    ignoredCount: 1
  };
  const expected = stringify({
    type: syncPlanResult,
    operations: [],
    skippedCount: 0,
    ignored: {
      [A.SourceProvider.root]: [
        {
          file: renderedFiles[A.Key]
        }
      ]
    },
    ignoredCount: 1
  });
  const logger = new JsonLogger({ showIgnored: true });
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: syncPlanResult (showHashes + showIgnored + showSkipped)', () => {
  const value: MessageSyncPlanResult = {
    type: syncPlanResult,
    operations: [],
    skipped: [
      {
        type: 'skip',
        reason: 'CHANGE',
        file: A,
        targetFile: A
      }
    ],
    skippedCount: 1,
    ignored: {
      [A.SourceProvider.root]: [
        {
          type: 'ignore',
          file: A
        }
      ]
    },
    ignoredCount: 1
  };
  const expected = stringify({
    type: syncPlanResult,
    operations: [],
    skipped: [
      {
        reason: 'CHANGE',
        file: renderedFilesWithETag[A.Key],
        targetFile: renderedFilesWithETag[A.Key]
      }
    ],
    skippedCount: 1,
    ignored: {
      [A.SourceProvider.root]: [
        {
          file: renderedFilesWithETag[A.Key]
        }
      ]
    },
    ignoredCount: 1
  });
  const logger = new JsonLogger({
    showHashes: true,
    showIgnored: true,
    showSkipped: true
  });
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: syncOperationBegin PUT', () => {
  const value: MessageSyncOperationBegin = {
    type: syncOperationBegin,
    operation: {
      type: 'PUT',
      reason: 'ADD',
      file: A,
      params: params[A.Key],
      job: () => Promise.resolve()
    }
  };
  const expected = stringify({
    type: syncOperationBegin,
    operation: {
      type: 'PUT',
      reason: 'ADD',
      file: renderedFiles[A.Key]
    }
  });
  const logger = new JsonLogger();
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: syncOperationBegin PUT (showHashes)', () => {
  const value: MessageSyncOperationBegin = {
    type: syncOperationBegin,
    operation: {
      type: 'PUT',
      reason: 'ADD',
      file: A,
      params: params[A.Key],
      job: () => Promise.resolve()
    }
  };
  const expected = stringify({
    type: syncOperationBegin,
    operation: {
      type: 'PUT',
      reason: 'ADD',
      file: renderedFilesWithETag[A.Key]
    }
  });
  const logger = new JsonLogger({ showHashes: true });
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: syncOperationBegin PUT (showParams)', () => {
  const value: MessageSyncOperationBegin = {
    type: syncOperationBegin,
    operation: {
      type: 'PUT',
      reason: 'ADD',
      file: A,
      params: params[A.Key],
      job: () => Promise.resolve()
    }
  };
  const expected = stringify({
    type: syncOperationBegin,
    operation: {
      type: 'PUT',
      reason: 'ADD',
      file: renderedFiles[A.Key],
      params: params[A.Key]
    }
  });
  const logger = new JsonLogger({ showParams: true });
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: syncOperationResult PUT', () => {
  const value: MessageSyncOperationResult = {
    type: syncOperationResult,
    operation: {
      type: 'PUT',
      reason: 'ADD',
      file: A,
      params: params[A.Key],
      job: () => Promise.resolve()
    },
    duration: 122
  };
  const expected = stringify({
    type: syncOperationResult,
    operation: {
      type: 'PUT',
      reason: 'ADD',
      file: renderedFiles[A.Key]
    },
    duration: '122ms'
  });
  const logger = new JsonLogger();
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: syncOperationResult PUT (showHashes)', () => {
  const value: MessageSyncOperationResult = {
    type: syncOperationResult,
    operation: {
      type: 'PUT',
      reason: 'ADD',
      file: A,
      params: params[A.Key],
      job: () => Promise.resolve()
    },
    duration: 122
  };
  const expected = stringify({
    type: syncOperationResult,
    operation: {
      type: 'PUT',
      reason: 'ADD',
      file: renderedFilesWithETag[A.Key]
    },
    duration: '122ms'
  });
  const logger = new JsonLogger({ showHashes: true });
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: syncOperationResult PUT (showParams)', () => {
  const value: MessageSyncOperationResult = {
    type: syncOperationResult,
    operation: {
      type: 'PUT',
      reason: 'ADD',
      file: A,
      params: params[A.Key],
      job: () => Promise.resolve()
    },
    duration: 122
  };
  const expected = stringify({
    type: syncOperationResult,
    operation: {
      type: 'PUT',
      reason: 'ADD',
      file: renderedFiles[A.Key],
      params: params[A.Key]
    },
    duration: '122ms'
  });
  const logger = new JsonLogger({ showParams: true });
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: error', () => {
  const value: MessageError = {
    type: error,
    error: new Error('Fake error')
  };
  const expected = stringify({
    type: error,
    error: {
      message: 'Fake error'
    }
  });
  const logger = new JsonLogger();
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: error (with props)', () => {
  const fakeError = new ErrorWithCode('Fake error');
  fakeError.code = 401;
  const value: MessageError = {
    type: error,
    error: fakeError
  };
  const expected = stringify({
    type: error,
    error: {
      message: 'Fake error',
      code: 401
    }
  });
  const logger = new JsonLogger();
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});

test('JsonLogger.replacer: error (showErrorStack)', () => {
  const value: MessageError = {
    type: error,
    error: new Error('Fake error')
  };
  const expected = {
    type: error,
    error: {
      message: 'Fake error',
      stack: 'Error: Fake error\n'
    }
  };
  const logger = new JsonLogger({ showErrorStack: true });
  const result = stringify(value, logger.replacer);
  const parsedResult = JSON.parse(result);
  expect(parsedResult.type).toBe(expected.type);
  expect(parsedResult.error.message).toBe(expected.error.message);
  expect(parsedResult.error.stack.startsWith(expected.error.stack)).toBe(true);
});

test('JsonLogger.replacer: version', () => {
  const value: MessageVersion = {
    type: version,
    packageVersions: {
      '@s3-publish/cli': '2.0.0',
      '@s3-publish/core': '1.0.0'
    }
  };
  const expected = stringify({
    type: version,
    packageVersions: {
      '@s3-publish/cli': '2.0.0',
      '@s3-publish/core': '1.0.0'
    }
  });
  const logger = new JsonLogger({});
  const result = stringify(value, logger.replacer);
  expect(result).toEqual(expected);
});
