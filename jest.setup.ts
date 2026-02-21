import "@testing-library/react-native/build/matchers/extend-expect";

jest.mock("phosphor-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");

  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) =>
      React.createElement(View, { testID: `icon-${name}`, ...props });
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    AlignLeftIcon: createMockIcon("AlignLeftIcon"),
    HouseIcon: createMockIcon("HouseIcon"),
    BookOpenIcon: createMockIcon("BookOpenIcon"),
    CameraIcon: createMockIcon("CameraIcon"),
    CircleIcon: createMockIcon("CircleIcon"),
    EnvelopeSimpleIcon: createMockIcon("EnvelopeSimpleIcon"),
    PushPinIcon: createMockIcon("PushPinIcon"),
    RectangleIcon: createMockIcon("RectangleIcon"),
    SquaresFourIcon: createMockIcon("SquaresFourIcon"),
    TicketIcon: createMockIcon("TicketIcon"),
    PlusIcon: createMockIcon("PlusIcon"),
    CaretDownIcon: createMockIcon("CaretDownIcon"),
    CaretUpIcon: createMockIcon("CaretUpIcon"),
    HeartIcon: createMockIcon("HeartIcon"),
    UserIcon: createMockIcon("UserIcon"),
  };
});

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));
