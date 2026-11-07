module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts'],
  modulePathIgnorePatterns: ['<rootDir>/eas-inspect-archive/'],
  collectCoverageFrom: ['src/game/**/*.ts'],
};
