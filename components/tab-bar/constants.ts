import {
  BookOpenIcon,
  HeartIcon,
  HouseIcon,
  PlusIcon,
  UserIcon,
  IconProps,
} from "phosphor-react-native";
import {
  ICON_SIZE_RATIO,
  IMAGE_ASPECT_RATIO,
  TAB_BAR_HEIGHT_RATIO,
} from "@/constants/layout";

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

export { IMAGE_ASPECT_RATIO, TAB_BAR_HEIGHT_RATIO, ICON_SIZE_RATIO };
