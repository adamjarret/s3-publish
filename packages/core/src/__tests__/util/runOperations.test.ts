import { runOperations, RunOperationsOptions } from '../../util/runOperations';
import { createOperationFixtures } from '../__fixtures__/operations';

const MIN_DURATION = 0;

test('runOperations: empty', () => {
  const options: RunOperationsOptions = {
    operations: []
  };
  expect(runOperations(options)).rejects.toEqual(new Error('Nothing to do'));
});

test('runOperations: mixed', (done) => {
  const operations = createOperationFixtures();
  const operationsCount = operations.length;
  const options: RunOperationsOptions = {
    operations
  };

  runOperations(options).then((results) => {
    operations.forEach((op) => {
      expect(op.job).toHaveBeenCalledTimes(1);
    });

    expect(results.length).toBe(operationsCount);

    results.forEach((result) => {
      expect(result.duration).toBeGreaterThan(MIN_DURATION);
    });

    done();
  });
});

test('runOperations: mixed (onProgress)', (done) => {
  let i = 0;
  const operations = createOperationFixtures();
  const operationsCount = operations.length;
  const onProgress = jest.fn((operation, result) => {
    switch (i) {
      case 0:
      case 2:
      case 4:
        expect(operation).toEqual(operations[i / 2]);
        expect(result).toBeUndefined();
        break;
      case 1:
      case 3:
      case 5:
        expect(operation).toEqual(operations[(i - 1) / 2]);
        expect(result.duration).toBeGreaterThan(MIN_DURATION);
        break;
    }
    i++;
  });
  const options: RunOperationsOptions = {
    // parallel defaults to 1
    operations,
    onProgress
  };

  runOperations(options).then((results) => {
    expect(onProgress).toHaveBeenCalledTimes(operationsCount * 2);

    operations.forEach((op) => {
      expect(op.job).toHaveBeenCalledTimes(1);
    });

    expect(results.length).toBe(operationsCount);

    results.forEach((result) => {
      expect(result.duration).toBeGreaterThan(MIN_DURATION);
    });

    done();
  });
});

test('runOperations: mixed (parallel=10, onProgress)', (done) => {
  let i = 0;
  const operations = createOperationFixtures();
  const operationsCount = operations.length;
  const onProgress = jest.fn((operation, result) => {
    switch (i) {
      case 0:
      case 1:
      case 2:
        expect(operation).toEqual(operations[i]);
        expect(result).toBeUndefined();
        break;
      case 3:
      case 4:
      case 5:
        expect(operation).toEqual(operations[Math.abs(5 - i)]);
        expect(result.duration).toBeGreaterThan(MIN_DURATION);
        break;
    }
    i++;
  });
  const options: RunOperationsOptions = {
    parallel: 10,
    operations,
    onProgress
  };

  runOperations(options).then((results) => {
    expect(onProgress).toHaveBeenCalledTimes(operationsCount * 2);

    operations.forEach((op) => {
      expect(op.job).toHaveBeenCalledTimes(1);
    });

    expect(results.length).toBe(operationsCount);

    results.forEach((result) => {
      expect(result.duration).toBeGreaterThan(MIN_DURATION);
    });

    done();
  });
});

test('runOperations: mixed (parallel=2, onProgress)', (done) => {
  let i = 0;
  const operations = createOperationFixtures();
  const operationsCount = operations.length;
  const onProgress = jest.fn((operation, result) => {
    switch (i) {
      case 0:
      case 1:
        expect(operation).toEqual(operations[i]);
        expect(result).toBeUndefined();
        break;
      case 2:
        expect(operation).toEqual(operations[1]);
        expect(result.duration).toBeGreaterThan(MIN_DURATION);
        break;
      case 3:
        expect(operation).toEqual(operations[2]);
        expect(result).toBeUndefined();
        break;
      case 4:
        expect(operation).toEqual(operations[2]);
        expect(result.duration).toBeGreaterThan(MIN_DURATION);
        break;
      case 5:
        expect(operation).toEqual(operations[0]);
        expect(result.duration).toBeGreaterThan(MIN_DURATION);
        break;
    }
    i++;
  });
  const options: RunOperationsOptions = {
    parallel: 2,
    operations,
    onProgress
  };

  runOperations(options).then((results) => {
    expect(onProgress).toHaveBeenCalledTimes(operationsCount * 2);

    operations.forEach((op) => {
      expect(op.job).toHaveBeenCalledTimes(1);
    });

    expect(results.length).toBe(operationsCount);

    results.forEach((result) => {
      expect(result.duration).toBeGreaterThan(MIN_DURATION);
    });

    done();
  });
});
