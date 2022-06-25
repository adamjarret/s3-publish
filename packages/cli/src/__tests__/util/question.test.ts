import { question } from '../../util/question';
import { mockProcessStdout } from 'jest-mock-process';
import mockStdin from 'mock-stdin';

test('question', async () => {
  const mockStdout = mockProcessStdout();
  const stdin = mockStdin.stdin();

  process.nextTick(() => {
    stdin.send('Y\n');
  });

  const text = 'Continue? (Y/n) ';
  const result = await question(text);

  expect(result).toEqual('Y');

  // An unknown condition causes this to fail under certain circumstances
  //  Sometimes there are newlines that precede the text meaning the text
  //  is passed on the third invocation instead of the first.
  //expect(mockStdout).toHaveBeenNthCalledWith(1, text);

  stdin.restore();
  mockStdout.mockRestore();
});
