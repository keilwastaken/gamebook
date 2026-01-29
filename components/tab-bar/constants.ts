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

// Image aspect ratio (1536x1024)
export const IMAGE_ASPECT_RATIO = 1024 / 1536;

// Visible tab bar height as ratio of screen width
export const TAB_BAR_HEIGHT_RATIO = 0.28;

// Icon size as percentage of screen width
export const ICON_SIZE_RATIO = 0.1;
