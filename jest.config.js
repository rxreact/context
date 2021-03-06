// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // A set of global variables that need to be available in all test environments
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.json"
    }
  },

  // An array of directory names to be searched recursively up from the requiring module's location
  // moduleDirectories: [
  //   "node_modules"
  // ],

  // An array of file extensions your modules use
  moduleFileExtensions: ["ts", "tsx", "js"],

  // A map from regular expressions to paths to transformers
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },

  testPathIgnorePatterns: ["/node_modules/", "/sample/"],

  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"]
};
