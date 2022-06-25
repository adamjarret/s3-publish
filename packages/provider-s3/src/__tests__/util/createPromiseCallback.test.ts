import { createPromiseCallback } from '../../util/createPromiseCallback';

test('createPromiseCallback: result', () => {
  const resolve = jest.fn();
  const reject = jest.fn();
  const callback = createPromiseCallback(resolve, reject);
  const value = 'VALUE';
  callback(null, value);
  expect(resolve).toHaveBeenCalledTimes(1);
  expect(resolve).toHaveBeenCalledWith(value);
  expect(reject).toHaveBeenCalledTimes(0);
});

test('createPromiseCallback: error', () => {
  const resolve = jest.fn();
  const reject = jest.fn();
  const callback = createPromiseCallback(resolve, reject);
  const error = new Error('Fake error');
  callback(error, undefined);
  expect(resolve).toHaveBeenCalledTimes(0);
  expect(reject).toHaveBeenCalledWith(error);
  expect(reject).toHaveBeenCalledTimes(1);
});
