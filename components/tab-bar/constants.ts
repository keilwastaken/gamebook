import {
  BookOpenIcon,
  HeartIcon,
  HouseIcon,
  PlusIcon,
  UserIcon,
  IconProps,
} from "phosphor-react-native";

export type PhosphorIcon = React.ComponentType<IconProps>;

export interface TabConfig {
  name: string;
  label: string;
  icon: PhosphorIcon;
  isCenter?: boolean;
}

export const TABS: TabConfig[] = [
  { name: "index", label: "Home", icon: HouseIcon },
  { name: "library", label: "Library", icon: BookOpenIcon },
  { name: "add", label: "Add", icon: PlusIcon, isCenter: true },
  { name: "favorites", label: "Favorites", icon: HeartIcon },
  { name: "profile", label: "Profile", icon: UserIcon },
];

// Layout dimensions
export const CENTER_BUTTON_SIZE = 56;
export const CURVE_WIDTH = 90;
export const CURVE_DEPTH = 30;
