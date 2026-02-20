import { render, screen, fireEvent } from "@testing-library/react-native";

import { TABS } from "../constants";
import { TabButton } from "../tab-button";

const homeTab = TABS.find((t) => t.name === "index")!;

const defaultProps = {
  tab: homeTab,
  isFocused: false,
  iconSize: 30,
  onPress: jest.fn(),
  activeColor: "#FFFFFF",
  inactiveColor: "#888888",
  activeIconShadowColor: "#000000",
};

describe("TabButton", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the tab icon", () => {
    render(<TabButton {...defaultProps} />);
    expect(screen.getByTestId("icon-HouseIcon")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    render(<TabButton {...defaultProps} />);
    fireEvent.press(screen.getByTestId("icon-HouseIcon"));
    expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
  });

  it("uses inactive color when not focused", () => {
    render(<TabButton {...defaultProps} isFocused={false} />);
    const icon = screen.getByTestId("icon-HouseIcon");
    expect(icon.props.color).toBe(defaultProps.inactiveColor);
  });

  it("uses active color when focused", () => {
    render(<TabButton {...defaultProps} isFocused={true} />);
    const icon = screen.getByTestId("icon-HouseIcon");
    expect(icon.props.color).toBe(defaultProps.activeColor);
  });

  it("scales icon size up when focused", () => {
    render(<TabButton {...defaultProps} isFocused={true} iconSize={30} />);
    const icon = screen.getByTestId("icon-HouseIcon");
    expect(icon.props.size).toBe(33); // 30 * 1.1
  });
});
