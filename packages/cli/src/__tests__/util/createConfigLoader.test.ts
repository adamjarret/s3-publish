import path from 'path';
import { createConfigLoader } from '../../util/createConfigLoader';

test('createConfigLoader', () => {
  const loader = createConfigLoader(require);
  const config = loader(
    path.resolve(__dirname, '..', '..', '..', 'config', 's3p.config.js')
  );
  expect(config).toEqual({
    origin: {
      root: '.'
    },
    target: {
      root: ''
    },
    schemaVersion: 2
  });
});

test('createConfigLoader: invalid schemaVersion', () => {
  const loader = createConfigLoader(require);
  expect(() => {
    loader(path.resolve(__dirname, '..', '__fixtures__', 's3p.config.invalidSchema.js'));
  }).toThrow();
});

test('createConfigLoader: missing schemaVersion', () => {
  const loader = createConfigLoader(require);
  expect(() => {
    loader(path.resolve(__dirname, '..', '__fixtures__', 's3p.config.missingSchema.js'));
  }).toThrow();
});

test('createConfigLoader: undefined path', () => {
  const loader = createConfigLoader(require);
  const config = loader();
  expect(config).toEqual({
    origin: {
      root: '.'
    },
    target: {
      root: ''
    },
    schemaVersion: 2
  });
});

test('createConfigLoader: falsy path', () => {
  const loader = createConfigLoader(require);
  const config = loader('');
  expect(config).toEqual({
    origin: {
      root: '.'
    },
    target: {
      root: ''
    },
    schemaVersion: 2
  });
});

test('createConfigLoader: non-existent path', () => {
  const loader = createConfigLoader(require);
  const config = loader('this.file.does.not.exist.js');
  expect(config).toEqual({
    origin: {
      root: '.'
    },
    target: {
      root: ''
    },
    schemaVersion: 2
  });
});
