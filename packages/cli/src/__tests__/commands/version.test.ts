import { mockProcessStdout, mockProcessStderr } from 'jest-mock-process';
import version from '../../commands/version';
import { packageVersions } from '../../constants/packageVersions';

test('version', () => {
  const log = jest.fn();
  const logger = { log };

  version({ logger });

  expect(log).toHaveBeenCalledWith({
    type: 'version',
    packageVersions
  });
});

test('version: no logger', () => {
  const mockStdout = mockProcessStdout();
  const mockStderr = mockProcessStderr();

  version({});

  expect(mockStdout).toHaveBeenCalledTimes(0);
  expect(mockStderr).toHaveBeenCalledTimes(0);

  mockStdout.mockRestore();
  mockStderr.mockRestore();
});
