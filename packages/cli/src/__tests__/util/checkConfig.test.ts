import { checkConfig } from '../../util/checkConfig';

test('checkConfig', () => {
  const config = {
    origin: { root: '.' },
    target: { root: '' },
    schemaVersion: 2
  };
  const result = checkConfig(config);
  expect(result).toEqual(config);
});
