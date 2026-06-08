module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  testPathIgnorePatterns: ["/node_modules/", "/services/auth/"],
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      diagnostics: false,
      tsconfig: "services/api/tsconfig.json",
    }],
  },
  collectCoverageFrom: ["**/*.ts"],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
