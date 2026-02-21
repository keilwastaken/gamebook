/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["./jest.setup.ts"],
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|react-native-svg|nativewind|phosphor-react-native))",
    "/node_modules/react-native-reanimated/plugin/",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  modulePathIgnorePatterns: ["<rootDir>/tmp/"],
  collectCoverageFrom: [
    "components/**/*.{ts,tsx}",
    "hooks/**/*.{ts,tsx}",
    "constants/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "!**/__tests__/**",
    "!**/*.d.ts",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
};
