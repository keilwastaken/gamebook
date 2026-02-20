import * as ReactNative from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme, useThemeColor } from "../use-theme-color";

describe("use-theme-color", () => {
  let useColorSchemeSpy: jest.SpyInstance;

  beforeEach(() => {
    useColorSchemeSpy = jest
      .spyOn(ReactNative, "useColorScheme")
      .mockReturnValue("light");
  });

  afterEach(() => {
    useColorSchemeSpy.mockRestore();
  });

  it("proxies useColorScheme from react-native", () => {
    useColorSchemeSpy.mockReturnValue("dark");
    expect(useColorScheme()).toBe("dark");
  });

  it("prefers explicit light/dark prop colors", () => {
    useColorSchemeSpy.mockReturnValue("dark");
    expect(useThemeColor({ dark: "#112233" }, "text")).toBe("#112233");
  });

  it("falls back to theme palette when prop override is missing", () => {
    useColorSchemeSpy.mockReturnValue("dark");
    expect(useThemeColor({}, "text")).toBe(Colors.dark.text);
  });

  it("treats null color scheme as light", () => {
    useColorSchemeSpy.mockReturnValue(null);
    expect(useThemeColor({}, "background")).toBe(Colors.light.background);
  });
});
