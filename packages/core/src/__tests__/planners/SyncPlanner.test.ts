import { SyncPlanner } from '../../planners/SyncPlanner';
import { File, SkipEvent } from '../../types';
import { MockProvider } from '../../__mock__/MockProvider';
import { sleep } from '../../__mock__/__util__/sleep';
import { A, B, C } from '../__fixtures__/files';

test('SyncPlanner: ntd', (done) => {
  const provider = new MockProvider({
    root: './public',
    files: [A, B, C]
  });
  const planner = new SyncPlanner({
    origin: provider,
    target: provider
  });
  planner.plan().then((result) => {
    expect(result).toEqual([]);
    done();
  });
});

test('SyncPlanner: skip/ignore', (done) => {
  const onSkip = jest.fn();
  const onIgnore = jest.fn();
  const provider = new MockProvider({
    root: './public',
    files: [A, B, C],
    ignores: (file) => file.Key === A.Key
  });
  const planner = new SyncPlanner({
    origin: provider,
    target: provider
  });
  const expectedCallCount = provider.files.size;
  planner.plan({ onSkip, onIgnore }).then((result) => {
    expect(onSkip).toHaveBeenCalledTimes(expectedCallCount - 1);
    // onIgnore should have been called once for each ignored file
    //  IN EACH PROVIDER
    expect(onIgnore).toHaveBeenCalledTimes(2);
    expect(result).toEqual([]);
    done();
  });
});

test('SyncPlanner: addMissing=true (same protocol)', (done) => {
  const origin = new MockProvider({
    root: './public',
    files: [A, B, C]
  });
  const target = new MockProvider({
    root: 's3://s3p-test',
    files: [A, B]
  });
  const planner = new SyncPlanner({
    // addMissing defaults to true
    //addMissing: true
    origin,
    target
  });
  planner.plan().then((result) => {
    expect(result).toMatchObject([
      { type: 'COPY', reason: 'ADD', file: origin.files.get(C.Key), params: {} }
    ]);
    done();
  });
});

test('SyncPlanner: addMissing=true (mixed protocol)', (done) => {
  const origin = new MockProvider({
    root: './public',
    files: [A, B, C]
  });
  const target = new MockProvider({
    protocol: 's3',
    root: 's3://s3p-test',
    files: [A, B]
  });
  const planner = new SyncPlanner({
    // addMissing defaults to true
    //addMissing: true
    origin,
    target
  });
  planner.plan().then((result) => {
    expect(result).toMatchObject([
      { type: 'PUT', reason: 'ADD', file: origin.files.get(C.Key), params: {} }
    ]);
    done();
  });
});

test('SyncPlanner: addMissing=false', (done) => {
  const origin = new MockProvider({
    root: './public',
    files: [A, B, C]
  });
  const target = new MockProvider({
    protocol: 's3',
    root: 's3://s3p-test',
    files: [A, B]
  });
  const planner = new SyncPlanner({
    addMissing: false,
    origin,
    target
  });
  planner.plan().then((result) => {
    expect(result).toEqual([]);
    done();
  });
});

test('SyncPlanner: addMissing=false + onSkip', (done) => {
  let i = 0;
  const onSkip = jest.fn(({ file, reason }: SkipEvent) => {
    switch (i) {
      case 0:
        expect(file.Key).toEqual(A.Key);
        expect(reason).toEqual('CHANGE');
        break;
      case 1:
        expect(file.Key).toEqual(B.Key);
        expect(reason).toEqual('CHANGE');
        break;
      case 2:
        expect(file.Key).toEqual(C.Key);
        expect(reason).toEqual('ADD');
        break;
    }
    i++;
  });
  const origin = new MockProvider({
    root: './public',
    files: [A, B, C]
  });
  const target = new MockProvider({
    protocol: 's3',
    root: 's3://s3p-test',
    files: [A, B]
  });
  const planner = new SyncPlanner({
    addMissing: false,
    origin,
    target
  });
  planner.plan({ onSkip }).then((result) => {
    expect(result).toEqual([]);
    expect(onSkip).toHaveBeenCalledTimes(3);
    done();
  });
});

test('SyncPlanner: compare=FN (same protocol)', (done) => {
  const compare = jest.fn(
    (a: File, b: File): Promise<boolean> => Promise.resolve(a.Size === b.Size)
  );
  const origin = new MockProvider({
    root: './public',
    files: [A, B, C]
  });
  const target = new MockProvider({
    root: 's3://s3p-test',
    files: [{ ...A, Size: (A.Size ?? 0) + 12 }, B, C]
  });
  const planner = new SyncPlanner({
    compare,
    origin,
    target
  });
  const expectedCallCount = origin.files.size;
  planner.plan().then((result) => {
    expect(compare).toHaveBeenCalledTimes(expectedCallCount);
    expect(result).toMatchObject([
      { type: 'COPY', reason: 'CHANGE', file: origin.files.get(A.Key), params: {} }
    ]);
    done();
  });
});

test('SyncPlanner: compare=FN (mixed protocol)', (done) => {
  const compare = jest.fn(
    (a: File, b: File): Promise<boolean> => Promise.resolve(a.Size === b.Size)
  );
  const origin = new MockProvider({
    root: './public',
    files: [A, B, C]
  });
  const target = new MockProvider({
    protocol: 's3',
    root: 's3://s3p-test',
    files: [{ ...A, Size: (A.Size ?? 0) + 12 }, B, C]
  });
  const planner = new SyncPlanner({
    compare,
    origin,
    target
  });
  const expectedCallCount = origin.files.size;
  planner.plan().then((result) => {
    expect(compare).toHaveBeenCalledTimes(expectedCallCount);
    expect(result).toMatchObject([
      { type: 'PUT', reason: 'CHANGE', file: origin.files.get(A.Key), params: {} }
    ]);
    done();
  });
});

test('SyncPlanner: compare=FN, limitCompares=1 (mixed protocol)', (done) => {
  let c = 0;
  let i = 0;
  const onSkip = jest.fn(({ file }: SkipEvent) => {
    switch (i) {
      case 0:
        expect(file.Key).toEqual(A.Key);
        break;
      case 1:
        expect(file.Key).toEqual(B.Key);
        break;
      case 2:
        expect(file.Key).toEqual(C.Key);
        break;
    }
    i++;
  });
  const compare = jest.fn(async (a: File, b: File): Promise<boolean> => {
    switch (c) {
      case 0:
        expect(a.Key).toEqual(A.Key);
        break;
      case 1:
        expect(a.Key).toEqual(B.Key);
        break;
      case 2:
        expect(a.Key).toEqual(C.Key);
        break;
    }
    c++;
    await sleep((4 - c) * 16);
    return a.Size === b.Size;
  });
  const origin = new MockProvider({
    root: './public',
    files: [A, B, C]
  });
  const target = new MockProvider({
    protocol: 's3',
    root: 's3://s3p-test',
    files: [A, B, C]
  });
  const planner = new SyncPlanner({
    // limitCompares defaults to 1
    //limitCompares: 1
    compare,
    origin,
    target
  });
  const expectedCallCount = origin.files.size;
  planner.plan({ onSkip }).then((result) => {
    expect(onSkip).toHaveBeenCalledTimes(expectedCallCount);
    expect(compare).toHaveBeenCalledTimes(expectedCallCount);
    expect(result).toMatchObject([]);
    done();
  });
});

test('SyncPlanner: compare=FN, limitCompares=2 (mixed protocol)', (done) => {
  let c = 0;
  let i = 0;
  const onSkip = jest.fn(({ file }: SkipEvent) => {
    switch (i) {
      case 0:
        expect(file.Key).toEqual(B.Key);
        break;
      case 1:
        expect(file.Key).toEqual(A.Key);
        break;
      case 2:
        expect(file.Key).toEqual(C.Key);
        break;
    }
    i++;
  });
  const compare = jest.fn(async (a: File, b: File): Promise<boolean> => {
    switch (c) {
      case 0:
        expect(a.Key).toEqual(A.Key);
        break;
      case 1:
        expect(a.Key).toEqual(B.Key);
        break;
      case 2:
        expect(a.Key).toEqual(C.Key);
        break;
    }
    c++;
    await sleep((4 - c) * 16);
    return a.Size === b.Size;
  });
  const origin = new MockProvider({
    root: './public',
    files: [A, B, C]
  });
  const target = new MockProvider({
    protocol: 's3',
    root: 's3://s3p-test',
    files: [A, B, C]
  });
  const planner = new SyncPlanner({
    limitCompares: 2,
    compare,
    origin,
    target
  });
  const expectedCallCount = origin.files.size;
  planner.plan({ onSkip }).then((result) => {
    expect(onSkip).toHaveBeenCalledTimes(expectedCallCount);
    expect(compare).toHaveBeenCalledTimes(expectedCallCount);
    expect(result).toMatchObject([]);
    done();
  });
});

test('SyncPlanner: compare=false (mixed protocol)', (done) => {
  const origin = new MockProvider({
    root: './public',
    files: [A, B, C]
  });
  const target = new MockProvider({
    protocol: 's3',
    root: 's3://s3p-test',
    files: [{ ...A, Size: (A.Size ?? 0) + 12 }, B, C]
  });
  const planner = new SyncPlanner({
    compare: false,
    origin,
    target
  });
  planner.plan().then((result) => {
    expect(result).toMatchObject([
      { type: 'PUT', reason: 'CHANGE', file: origin.files.get(A.Key), params: {} },
      { type: 'PUT', reason: 'CHANGE', file: origin.files.get(B.Key), params: {} },
      { type: 'PUT', reason: 'CHANGE', file: origin.files.get(C.Key), params: {} }
    ]);
    done();
  });
});

test('SyncPlanner: deleteOrphans=false', (done) => {
  const origin = new MockProvider({
    root: './public',
    files: [A, B]
  });
  const target = new MockProvider({
    protocol: 's3',
    root: 's3://s3p-test',
    files: [A, B, C]
  });
  const planner = new SyncPlanner({
    // deleteOrphans defaults to false
    //deleteOrphans: false
    origin,
    target
  });
  planner.plan().then((result) => {
    expect(result).toEqual([]);
    done();
  });
});

test('SyncPlanner: deleteOrphans=true', (done) => {
  const origin = new MockProvider({
    root: './public',
    files: [A, B]
  });
  const target = new MockProvider({
    protocol: 's3',
    root: 's3://s3p-test',
    files: [A, B, C]
  });
  const planner = new SyncPlanner({
    deleteOrphans: true,
    origin,
    target
  });
  planner.plan().then((result) => {
    expect(result).toMatchObject([
      { type: 'DELETE', file: target.files.get(C.Key), params: {} }
    ]);
    done();
  });
});
