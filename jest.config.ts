import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.spec.ts'],
  // A normal Jest run defaults to all but one available CPU. With 100+
  // TypeScript suites, that can create a large CPU and memory spike on
  // developer laptops.
  // Keep the default run predictably light; the CLI can still override this
  // explicitly (for example, `jest --maxWorkers=4` on a larger CI runner).
  maxWorkers: 2,
  maxConcurrency: 2,
  // Recycle a worker after a suite if its heap has grown unusually large.
  // An absolute value behaves consistently on laptops and in containers.
  workerIdleMemoryLimit: '384MB',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2022',
          parser: { syntax: 'typescript', decorators: true },
        },
      },
    ],
  },
  clearMocks: true,
  setupFiles: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__tests__/**',
    '!src/**/*.type.ts',
  ],
};

export default config;
