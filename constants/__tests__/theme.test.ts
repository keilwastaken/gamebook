import { palette } from "../palette";
import { Colors } from "../theme";

describe("theme constants", () => {
  it("defines both light and dark palettes", () => {
    expect(Colors.light).toBeDefined();
    expect(Colors.dark).toBeDefined();
  });

  it("maps key tokens to palette values", () => {
    expect(Colors.light.text).toBe(palette.sage[700]);
    expect(Colors.dark.text).toBe(palette.sage[100]);
    expect(Colors.light.tabIconSelected).toBe(palette.warm[200]);
    expect(Colors.dark.tabBarBackground).toBe(palette.cream.dark);
  });
});
