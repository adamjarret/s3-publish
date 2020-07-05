import { mockProcessStdout, mockProcessStderr } from 'jest-mock-process';
import help, { helpText, helpFooter } from '../../commands/help';

test('help', () => {
  const mockStdout = mockProcessStdout();
  const mockStderr = mockProcessStderr();

  help();

  expect(mockStdout).toHaveBeenCalledWith(`${helpText}${helpFooter}\n`);
  expect(mockStderr).toHaveBeenCalledTimes(0);

  mockStdout.mockRestore();
  mockStderr.mockRestore();
});
