module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // default: (/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$
  testRegex: process.env.SPEC
    ? '(\\.|/)(test|spec)\\.[jt]sx?$'
    : '(\\.|/)(test)\\.[jt]sx?$',
  collectCoverage: !!process.env.COVER,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/lib/',
    '/__mock__/',
    '/__tests__/',
    'index\\.ts$',
    '\\.test\\.ts$',
    'assertNever\\.ts'
  ],
  coverageReporters: ['text']
};
