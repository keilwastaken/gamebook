/** @type {import('@stryker-mutator/core').StrykerOptions} */
module.exports = {
  testRunner: "jest",
  mutate: [
    "lib/board-layout.ts",
    "lib/game-store.ts",
    "app/[(]tabs[)]/index.tsx",
  ],
  testFiles: [
    "lib/__tests__/board-layout.test.ts",
    "lib/__tests__/game-store.test.ts",
    "app/[(]tabs[)]/__tests__/index.test.tsx",
  ],
  ignorePatterns: [
    "coverage",
    "ios",
    "android",
    "artifacts",
    ".expo",
    ".screenshots",
    "recordings",
    "tmp",
  ],
  ignoreStatic: true,
  reporters: ["clear-text", "progress", "html"],
  coverageAnalysis: "perTest",
  concurrency: 4,
  timeoutMS: 60000,
  thresholds: {
    high: 85,
    low: 70,
    break: 65,
  },
  tempDirName: "tmp/stryker/dragdrop-full",
  jest: {
    projectType: "custom",
    configFile: "jest.config.js",
    enableFindRelatedTests: true,
  },
};
