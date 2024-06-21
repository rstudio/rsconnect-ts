module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  modulePathIgnorePatterns: ["./.cache/"],
  preset: 'ts-jest',
  testEnvironment: 'node'
}
