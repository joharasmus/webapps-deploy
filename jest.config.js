module.exports = {
    clearMocks: true,
    moduleFileExtensions: ['js', 'ts'],
    testMatch: ['**/DeploymentProviderFactory.test.ts', '**/main.test.ts'],
    transform: {
      'ts$': 'ts-jest'
    },
    verbose: true
  }