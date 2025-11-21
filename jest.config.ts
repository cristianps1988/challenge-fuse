import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/backend/(.*)$': '<rootDir>/backend/$1',
    '^@/frontend/(.*)$': '<rootDir>/frontend/$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
  collectCoverageFrom: [
    'backend/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.{js,jsx,ts,tsx}',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/*.constants.ts',
    '!**/errors/**/*.ts',
    '!**/ports/**/*.ts',
    '!**/*.DTO.ts',
    '!**/*.Response.ts',
    '!backend/infrastructure/logger/**',
    '!backend/infrastructure/external-services/openai/client.ts',
    '!backend/infrastructure/external-services/openai/OpenAIClassifier.Service.ts',
    '!backend/infrastructure/external-services/openai/OpenAIExtractor.Service.ts',
    '!backend/infrastructure/external-services/storage/**',
    '!backend/infrastructure/api/controllers/**',
    '!backend/infrastructure/di/container.ts',
    '!backend/domain/schemas/index.ts',
    '!backend/infrastructure/persistence/database.ts',
    '!backend/infrastructure/persistence/migrations.ts',
    '!backend/infrastructure/persistence/JsonlCorrectionLog.ts',
    '!backend/infrastructure/persistence/SqliteExtraction.Repository.ts',
    '!backend/infrastructure/persistence/SqliteCorrection.Repository.ts',
    '!app/layout.tsx',
    '!frontend/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

export default createJestConfig(config)
