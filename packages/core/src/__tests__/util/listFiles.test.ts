import { File, FileHandler } from '../../types';
import { listFiles, ListFilesOptions } from '../../util/listFiles';
import { MockProvider } from '../../__mock__/MockProvider';
import { A, B, C } from '../__fixtures__/files';

function createProviderFixtures(): MockProvider[] {
  return [
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
}

const MIN_DURATION = 0;

test('listFiles: empty', () => {
  const options: ListFilesOptions = {
    providers: []
  };
  expect(listFiles(options)).rejects.toEqual(new Error('Nothing to do'));
});

test('listFiles: single provider (calculateETag)', (done) => {
  const eTag = jest.fn();
  const provider = new MockProvider({
    root: './public',
    files: [A, B, C],
    onGetFileETag: eTag
  });
  const options: ListFilesOptions = {
    calculateETag: true,
    providers: [provider]
  };

  listFiles(options).then((results) => {
    expect(results.length).toBe(options.providers.length);

    results.forEach((result) => {
      expect(eTag).toHaveBeenCalledTimes(provider.files.size);

      const value = Array.from(result.files.values());
      const expected = Array.from(provider.files.values());
      expect(value).toEqual(expected);
      expect(result.duration).toBeGreaterThan(MIN_DURATION);
    });

    done();
  });
});

test('listFiles: single provider (onIgnore)', (done) => {
  const provider = new MockProvider({
    root: './public',
    files: [A, B, C],
    ignores: (file) => file.Key === A.Key
  });
  const onIgnore: FileHandler = jest.fn((file: File) => {
    expect(file.Key).toEqual(A.Key);
  });
  const options: ListFilesOptions = {
    onIgnore,
    providers: [provider]
  };

  listFiles(options).then((results) => {
    expect(onIgnore).toHaveBeenCalledTimes(1);

    expect(results.length).toBe(options.providers.length);

    expect(results[0].files.size).toBe(2);
    expect(results[0].duration).toBeGreaterThan(MIN_DURATION);

    done();
  });
});

test('listFiles: multi provider', (done) => {
  const providers = createProviderFixtures();
  const options: ListFilesOptions = {
    providers
  };

  listFiles(options).then((results) => {
    expect(results.length).toBe(options.providers.length);

    results.forEach((result, idx) => {
      const value = Array.from(result.files.values());
      const expected = Array.from(providers[idx].files.values());
      expect(value).toEqual(expected);
      expect(result.duration).toBeGreaterThan(MIN_DURATION);
    });

    done();
  });
});

test('listFiles: multi provider (onProgress)', (done) => {
  let i = 0;
  const providers = createProviderFixtures();
  const onProgress = jest.fn((provider, result) => {
    switch (i) {
      case 0:
      case 2:
        expect(provider).toEqual(providers[i / 2]);
        expect(result).toBeUndefined();
        break;
      case 1:
      case 3:
        expect(provider).toEqual(providers[(i - 1) / 2]);
        expect(result.duration).toBeGreaterThan(MIN_DURATION);
        break;
    }
    i++;
  });
  const options: ListFilesOptions = {
    // limitRequests defaults to 1
    onProgress,
    providers
  };

  listFiles(options).then((results) => {
    expect(results.length).toBe(options.providers.length);

    results.forEach((result, idx) => {
      const value = Array.from(result.files.values());
      const expected = Array.from(providers[idx].files.values());
      expect(value).toEqual(expected);
      expect(result.duration).toBeGreaterThan(MIN_DURATION);
    });

    done();
  });
});

test('listFiles: multi provider (limitRequests, onProgress)', (done) => {
  let i = 0;
  const providers = createProviderFixtures();
  const onProgress = jest.fn((provider, result) => {
    switch (i) {
      case 0:
      case 1:
        expect(provider).toEqual(providers[i]);
        expect(result).toBeUndefined();
        break;
      case 2:
      case 3:
        expect(provider).toEqual(providers[Math.abs(3 - i)]);
        expect(result.duration).toBeGreaterThan(MIN_DURATION);
        break;
    }
    i++;
  });
  const options: ListFilesOptions = {
    limitRequests: 10,
    onProgress,
    providers
  };

  listFiles(options).then((results) => {
    expect(results.length).toBe(options.providers.length);

    results.forEach((result, idx) => {
      const value = Array.from(result.files.values());
      const expected = Array.from(providers[idx].files.values());
      expect(value).toEqual(expected);
      expect(result.duration).toBeGreaterThan(MIN_DURATION);
    });

    done();
  });
});
