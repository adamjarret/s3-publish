import { MockProvider } from '../../__mock__/MockProvider';
import { sleep } from '../../__mock__/__util__/sleep';
import { ProviderOperation } from '../../types';
import { A, B, C } from '../__fixtures__/files';

function createJob(ms: number) {
  return jest.fn(() => sleep(ms));
}

export function createOperationFixtures(): ProviderOperation[] {
  const provider = new MockProvider({
    root: './public',
    files: [A, B, C]
  });

  return [
    {
      type: 'COPY',
      reason: 'ADD',
      params: {},
      file: provider.files.get(A.Key)!,
      job: createJob(64)
    },
    {
      type: 'DELETE',
      params: {},
      file: provider.files.get(B.Key)!,
      job: createJob(32)
    },
    {
      type: 'PUT',
      reason: 'CHANGE',
      params: {},
      file: provider.files.get(C.Key)!,
      job: createJob(16)
    }
  ];
}
